"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    Edit, Trash2, Play, BarChart2, Plus, X,
    Users, ChevronDown, ChevronRight, BookOpen, Edit2, Trash, LogOut, Menu, Loader2, Search, TrendingUp, Printer
} from "lucide-react";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ScatterChart, Scatter, ReferenceLine
} from "recharts";
import IconButton from "../components/IconButton";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { useRouter } from "next/navigation";
import api from "@/config/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";

interface Group {
    id_grupo: number;
    Nombre_Grupo: string;
    Año: number;
    Grado: number;
}

interface Student {
    id_discente: number;
    Nombre_Discente: string;
    Apellido_Paterno_Discente: string;
    Apellido_Materno_Discente: string;
    grupos?: Group[];
    Activo?: boolean;
    totalStars?: number;
    rachaDias?: number;
    rachaEstado?: 'activa' | 'congelada' | 'rota';
}

const RACHA_ICONS: Record<'activa' | 'congelada' | 'rota', string> = {
    activa: '/assets/fire_Icon.png',
    congelada: '/assets/icyFire_Icon.png',
    rota: '/assets/ice_Icon.png',
};

// Estado acumulado del alumno (promedios historicos), no una serie en el tiempo.
interface GroupStudentSummary {
    id_discente: number;
    nombre: string;
    attempts: number;
    avgPuntos: number;
    avgDificultad: number;
}

interface GroupStats {
    groupAverages: { fecha: string; avgPuntos: number; avgDificultad: number | null }[];
    perStudent: GroupStudentSummary[];
}

interface GameConfig {
    mode: 'historia' | 'custom' | null;
    type: 'prueba' | 'repaso' | null;
    element: 'tierra' | 'agua' | null;
    operation: string;
    timeLimit: string;
    numCifras: number;
    cifras: string[];
    resultado: string;
    numTrampas: number;
    trampas: string[];
}

// Quita acentos para que la búsqueda encuentre "Sofía" al escribir "sofia".
function normalizeSearchText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

// Sin leyenda ni colores por alumno: el tooltip es la unica forma de identificar cada punto.
function StudentScatterTooltip({ active, payload }: any) {
    if (!active || !payload || !payload.length) return null;
    const data: GroupStudentSummary = payload[0].payload;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
            <p className="font-semibold text-gray-800">{data.nombre}</p>
            <p className="text-gray-600">Puntaje promedio: <span className="font-medium">{data.avgPuntos}</span></p>
            <p className="text-gray-600">Dificultad promedio: <span className="font-medium">{data.avgDificultad}</span></p>
            <p className="text-gray-500 text-xs mt-1">{data.attempts} {data.attempts === 1 ? 'partida' : 'partidas'}</p>
        </div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const { docenteId: docenteActualId, docenteName, logout } = useAuth();
    const { showToast } = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
    const [selectedStudentForPlay, setSelectedStudentForPlay] = useState<Student | null>(null);
    const [playStep, setPlayStep] = useState<number>(1);
    const [gameConfig, setGameConfig] = useState<GameConfig>({
        mode: null,
        type: null,
        element: null,
        operation: 'suma',
        timeLimit: '',
        numCifras: 2,
        cifras: ['', ''],
        resultado: '',
        numTrampas: 1,
        trampas: ['']
    });

    const [studentFormData, setStudentFormData] = useState({
        Nombre_Discente: "",
        Apellido_Paterno_Discente: "",
        Apellido_Materno_Discente: ""
    });
    const [studentModalTab, setStudentModalTab] = useState<'nuevo' | 'existente'>('nuevo');
    const [studentSearchQuery, setStudentSearchQuery] = useState("");
    const [isAddingExistingStudent, setIsAddingExistingStudent] = useState(false);

    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [isDeletingStudent, setIsDeletingStudent] = useState(false);

    const [groups, setGroups] = useState<Group[]>([]);
    const [isGroupsSidebarOpen, setIsGroupsSidebarOpen] = useState(true);
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

    const [showGroupProgressModal, setShowGroupProgressModal] = useState(false);
    const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
    const [isLoadingGroupStats, setIsLoadingGroupStats] = useState(false);

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupFormData, setGroupFormData] = useState({ Nombre_Grupo: "", Año: "", Grado: "" });

    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [isDeletingGroup, setIsDeletingGroup] = useState(false);

    // Espera a que useAuth confirme la sesion antes de pedir datos.
    useEffect(() => {
        if (docenteActualId !== null) {
            fetchStudents();
            fetchGroups();
        }
    }, [docenteActualId]);

    // Solo cálculo local (sin API): no debe re-disparar fetchStudents/fetchGroups en cada tecleo.
    useEffect(() => {
        const activeCifras = gameConfig.cifras.filter(c => c !== "");

        if (activeCifras.length === gameConfig.numCifras && activeCifras.length > 0) {
            const nums = activeCifras.map(Number);
            let calculatedResult = nums[0];

            for (let i = 1; i < nums.length; i++) {
                if (gameConfig.operation === 'suma') calculatedResult += nums[i];
                else if (gameConfig.operation === 'resta') calculatedResult -= nums[i];
                else if (gameConfig.operation === 'multiplicacion') calculatedResult *= nums[i];
                else if (gameConfig.operation === 'division') calculatedResult /= nums[i];
            }

            const formattedResult = Number.isInteger(calculatedResult)
                ? String(calculatedResult)
                : calculatedResult.toFixed(2);

            // Solo actualiza si cambia, para evitar un ciclo infinito de renders.
            if (formattedResult !== gameConfig.resultado) {
                setGameConfig(prev => ({ ...prev, resultado: formattedResult }));
            }
        } else if (gameConfig.resultado !== "") {
            setGameConfig(prev => ({ ...prev, resultado: "" }));
        }
    }, [gameConfig.cifras, gameConfig.operation, gameConfig.numCifras]);

    const fetchStudents = async () => {
        setIsLoadingStudents(true);
        try {
            const res = await api.get("/discentes", {
                params: { tzOffset: new Date().getTimezoneOffset() }
            });
            setStudents(res.data);
        } catch (error) {
            console.error("Error al cargar alumnos", error);
            showToast("No se pudieron cargar los alumnos.", "error");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get("/groups");
            setGroups(res.data);
            if (res.data.length > 0 && !activeGroupId) {
                setActiveGroupId(res.data[0].id_grupo);
            }
        } catch (error) {
            console.error("Error al cargar grupos", error);
            showToast("No se pudieron cargar los grupos.", "error");
        }
    };

    // Los alumnos dados de baja por el administrador no se gestionan desde aqui
    const activeStudents = students.filter(student => student.Activo !== false);

    const filteredStudents = activeStudents.filter(student =>
        student.grupos?.some(g => g.id_grupo === activeGroupId)
    );

    const studentsAvailableToAdd = activeStudents.filter(student =>
        !student.grupos?.some(g => g.id_grupo === activeGroupId)
    );

    const studentSearchResults = studentSearchQuery.trim() === ""
        ? studentsAvailableToAdd
        : studentsAvailableToAdd.filter(student => {
            const fullName = normalizeSearchText(
                `${student.Nombre_Discente} ${student.Apellido_Paterno_Discente} ${student.Apellido_Materno_Discente}`
            );
            return fullName.includes(normalizeSearchText(studentSearchQuery.trim()));
        });

    const handleOpenAddStudent = () => {
        setEditingStudent(null);
        setStudentFormData({ Nombre_Discente: "", Apellido_Paterno_Discente: "", Apellido_Materno_Discente: "" });
        setStudentModalTab('nuevo');
        setStudentSearchQuery('');
        setIsStudentModalOpen(true);
    };

    const handleOpenEditStudent = (student: Student) => {
        setEditingStudent(student);
        setStudentFormData({
            Nombre_Discente: student.Nombre_Discente,
            Apellido_Paterno_Discente: student.Apellido_Paterno_Discente,
            Apellido_Materno_Discente: student.Apellido_Materno_Discente
        });
        setIsStudentModalOpen(true);
    };

    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            Nombre_Discente: studentFormData.Nombre_Discente,
            Apellido_Paterno_Discente: studentFormData.Apellido_Paterno_Discente,
            Apellido_Materno_Discente: studentFormData.Apellido_Materno_Discente,
            grupos: activeGroupId ? [{ id_grupo: activeGroupId }] : []
        };

        try {
            if (editingStudent) {
                await api.patch(`/discentes/${editingStudent.id_discente}`, payload);
            } else {
                await api.post("/discentes", payload);
            }
            setIsStudentModalOpen(false);
            showToast(editingStudent ? "Alumno actualizado correctamente." : "Alumno agregado correctamente.", "success");
            fetchStudents();
        } catch (error) {
            console.error("Error al guardar alumno", error);
            const mensaje = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            showToast(Array.isArray(mensaje) ? mensaje[0] : mensaje || "Error al guardar el alumno.", "error");
        }
    };

    const handleAddExistingStudent = async (student: Student) => {
        if (!activeGroupId) return;
        setIsAddingExistingStudent(true);
        try {
            const currentGroupIds = (student.grupos || []).map(g => g.id_grupo);
            const nextGroupIds = currentGroupIds.includes(activeGroupId)
                ? currentGroupIds
                : [...currentGroupIds, activeGroupId];

            await api.patch(`/discentes/${student.id_discente}`, {
                grupos: nextGroupIds.map(id_grupo => ({ id_grupo }))
            });
            setIsStudentModalOpen(false);
            showToast("Alumno agregado al grupo.", "success");
            fetchStudents();
        } catch (error) {
            console.error("Error al agregar alumno existente", error);
            const mensaje = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            showToast(Array.isArray(mensaje) ? mensaje[0] : mensaje || "Error al agregar el alumno.", "error");
        } finally {
            setIsAddingExistingStudent(false);
        }
    };

    const handleDeleteStudent = (student: Student) => {
        setStudentToDelete(student);
    };

    const confirmDeleteStudent = async () => {
        if (!studentToDelete || !activeGroupId) return;
        setIsDeletingStudent(true);
        try {
            // Solo desasigna del grupo; eliminar del sistema es exclusivo del panel de administracion.
            await api.delete(`/discentes/${studentToDelete.id_discente}/groups/${activeGroupId}`);
            setStudentToDelete(null);
            showToast("Alumno removido del grupo.", "success");
            fetchStudents();
        } catch (error) {
            console.error("Error al remover alumno del grupo", error);
            showToast("Hubo un error al remover al alumno del grupo.", "error");
        } finally {
            setIsDeletingStudent(false);
        }
    };

    const handleOpenGroupProgress = async () => {
        if (!activeGroupId) return;
        setShowGroupProgressModal(true);
        setIsLoadingGroupStats(true);
        try {
            const res = await api.get(`/groups/${activeGroupId}/stats`, {
                params: { tzOffset: new Date().getTimezoneOffset() }
            });
            setGroupStats(res.data);
        } catch (error) {
            console.error("Error al cargar el avance del grupo", error);
            showToast("No se pudo cargar el avance del grupo.", "error");
        } finally {
            setIsLoadingGroupStats(false);
        }
    };

    // fecha ya es dia local (backend, ver diaLocal en date.utils.ts). Se parsea a
    // mano: new Date("YYYY-MM-DD") lo interpretaria como UTC y desplazaria el dia.
    const formatShortDate = (isoDate: string) => {
        const [y, m, d] = isoDate.split('-');
        return `${d}/${m}/${y.slice(2)}`;
    };

    const groupAveragesChartData = (groupStats?.groupAverages || []).map((point) => ({
        fecha: formatShortDate(point.fecha),
        puntos: point.avgPuntos,
        dificultad: point.avgDificultad
    }));

    const handleOpenAddGroup = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingGroup(null);
        setGroupFormData({ Nombre_Grupo: "", Año: "", Grado: "" });
        setIsGroupModalOpen(true);
    };

    const handleOpenEditGroup = (e: React.MouseEvent, group: Group) => {
        e.stopPropagation();
        setEditingGroup(group);
        setGroupFormData({
            Nombre_Grupo: group.Nombre_Grupo,
            Año: String(group.Año),
            Grado: String(group.Grado)
        });
        setIsGroupModalOpen(true);
    };

    const handleGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (docenteActualId === null) return showToast("Error de sesión.", "error");

        const payload = {
            Nombre_Grupo: groupFormData.Nombre_Grupo,
            Año: Number(groupFormData.Año),
            Grado: Number(groupFormData.Grado),
            docente: { id_docente: docenteActualId }
        };

        try {
            if (editingGroup) {
                await api.patch(`/groups/${editingGroup.id_grupo}`, payload);
            } else {
                await api.post("/groups", payload);
            }
            setIsGroupModalOpen(false);
            showToast(editingGroup ? "Grupo actualizado correctamente." : "Grupo creado correctamente.", "success");
            fetchGroups();
        } catch (error) {
            console.error("Error al guardar grupo", error);
            const mensaje = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            showToast(Array.isArray(mensaje) ? mensaje[0] : mensaje || "Error al guardar el grupo.", "error");
        }
    };

    const handleDeleteGroup = (e: React.MouseEvent, group: Group) => {
        e.stopPropagation();
        setGroupToDelete(group);
    };

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return;
        setIsDeletingGroup(true);
        try {
            await api.delete(`/groups/${groupToDelete.id_grupo}`);
            if (activeGroupId === groupToDelete.id_grupo) setActiveGroupId(null);
            setGroupToDelete(null);
            showToast("Grupo eliminado.", "success");
            fetchGroups();
        } catch (error) {
            console.error("Error al eliminar grupo", error);
            showToast("Hubo un error al eliminar el grupo.", "error");
        } finally {
            setIsDeletingGroup(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-black overflow-hidden relative">

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-72 bg-gray-900 text-white flex flex-col shadow-2xl transform transition-transform duration-200 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
                <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <BookOpen size={24} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold tracking-wide">MateFácil</h2>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="mb-2">
                        <div
                            className="flex justify-between items-center cursor-pointer p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                            onClick={() => setIsGroupsSidebarOpen(!isGroupsSidebarOpen)}
                        >
                            <span className="font-semibold flex items-center gap-2">
                                <Users size={18} className="text-blue-400"/> Mis Grupos
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleOpenAddGroup}
                                    className="p-1 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition"
                                    title="Crear nuevo grupo"
                                >
                                    <Plus size={16}/>
                                </button>
                                {isGroupsSidebarOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                            </div>
                        </div>

                        {isGroupsSidebarOpen && (
                            <ul className="mt-2 space-y-1">
                                {groups.map(group => (
                                    <li
                                        key={group.id_grupo}
                                        onClick={() => setActiveGroupId(group.id_grupo)}
                                        className={`group flex justify-between items-center p-3 ml-2 rounded-lg cursor-pointer text-sm transition-all duration-200 ${
                                            activeGroupId === group.id_grupo
                                                ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-500"
                                                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-4 border-transparent"
                                        }`}
                                    >
                                        <span className="truncate pr-2">
                                            <strong className="font-medium text-gray-200">{group.Grado}°</strong> - {group.Nombre_Grupo} <span className="text-gray-500">({group.Año})</span>
                                        </span>

                                        <div className="hidden group-hover:flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleOpenEditGroup(e, group)}
                                                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-400"
                                            >
                                                <Edit2 size={14}/>
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteGroup(e, group)}
                                                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                                            >
                                                <Trash size={14}/>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {groups.length === 0 && (
                                    <li className="text-xs text-gray-500 text-center py-4 italic">No tienes grupos asignados</li>
                                )}
                            </ul>
                        )}
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-800 text-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300">
                        {docenteName?.trim().charAt(0).toUpperCase() || "P"}
                    </div>
                    <div className="flex flex-col items-start">
                        <p className="font-semibold text-gray-200">{docenteName}</p>
                        <button
                            onClick={logout}
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors mt-0.5 flex items-center gap-1"
                        >
                            <LogOut size={12} /> Cerrar sesión
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
                <div className="max-w-6xl mx-auto">

                    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 border-b border-gray-200 pb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                                aria-label="Abrir menú"
                            >
                                <Menu size={22} />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                    {activeGroupId && groups.find(g => g.id_grupo === activeGroupId)
                                        ? `${groups.find(g => g.id_grupo === activeGroupId)?.Grado}° - ${groups.find(g => g.id_grupo === activeGroupId)?.Nombre_Grupo} (${groups.find(g => g.id_grupo === activeGroupId)?.Año})`
                                        : "Selecciona un grupo"}
                                </h1>
                                <p className="text-gray-500 mt-1">Gestión de alumnos inscritos</p>
                            </div>
                        </div>
                        {activeGroupId && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push(`/reporte/grupo/${activeGroupId}`)}
                                    className="flex items-center justify-center gap-2 bg-white text-blue-700 border border-blue-200 px-5 py-2.5 rounded-lg hover:bg-blue-50 transition font-medium shrink-0"
                                >
                                    <Printer size={20} /> Imprimir reporte
                                </button>
                                <button
                                    onClick={handleOpenGroupProgress}
                                    className="flex items-center justify-center gap-2 bg-white text-blue-700 border border-blue-200 px-5 py-2.5 rounded-lg hover:bg-blue-50 transition font-medium shrink-0"
                                >
                                    <TrendingUp size={20} /> Ver avance del grupo
                                </button>
                                <button
                                    onClick={handleOpenAddStudent}
                                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-lg font-medium shrink-0"
                                >
                                    <Plus size={20} /> Agregar Alumno
                                </button>
                            </div>
                        )}
                    </header>

                    {activeGroupId ? (
                        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                            <table className="min-w-full leading-normal">
                                <thead>
                                <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-wider">
                                    <th className="py-4 px-6 text-left border-b border-gray-200">Nombre Completo</th>
                                    <th className="py-4 px-6 text-center border-b border-gray-200">Estrellas</th>
                                    <th className="py-4 px-6 text-center border-b border-gray-200">Racha</th>
                                    <th className="py-4 px-6 text-center border-b border-gray-200">Acciones</th>
                                </tr>
                                </thead>
                                <tbody className="text-gray-700 text-sm">
                                {isLoadingStudents ? (
                                    <tr><td colSpan={4} className="text-center py-10 text-gray-400"><Loader2 size={22} className="animate-spin mx-auto" /></td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-gray-500 italic">No hay alumnos en este grupo</td></tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id_discente} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                                            <td className="py-4 px-6 text-left font-medium">
                                                {student.Apellido_Paterno_Discente} {student.Apellido_Materno_Discente} {student.Nombre_Discente}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                                                    <img src="/assets/star_Icon.png" alt="" className="w-4 h-4" />
                                                    {student.totalStars ?? 0}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                                                    <img src={RACHA_ICONS[student.rachaEstado ?? 'rota']} alt="" className="w-4 h-4" />
                                                    {student.rachaDias ?? 0}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex item-center justify-center gap-3">
                                                    <IconButton icon={<Edit size={18} />} label="Modificar" onClick={() => handleOpenEditStudent(student)} color="text-blue-500" />
                                                    <IconButton icon={<Trash2 size={18} />} label="Quitar del grupo" onClick={() => handleDeleteStudent(student)} color="text-red-500" />
                                                    <IconButton
                                                        icon={<Play size={18} />}
                                                        label="Jugar"
                                                        onClick={() => {
                                                            setSelectedStudentForPlay(student);
                                                            setPlayStep(1);
                                                            setGameConfig({ mode: null, type: null, element: null, operation: 'suma', timeLimit: '', numCifras: 2, cifras: ['', ''], resultado: '', numTrampas: 1, trampas: [''] });
                                                            setIsPlayModalOpen(true);
                                                        }}
                                                        color="text-emerald-600"
                                                    />
                                                    <IconButton icon={<BarChart2 size={18} />} label="Estadísticas" onClick={() => router.push(`/stats/${student.id_discente}`)} color="text-yellow-600" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Users size={48} className="mb-4 text-gray-300"/>
                            <p className="text-lg">Selecciona un grupo en la barra lateral para ver sus alumnos.</p>
                        </div>
                    )}
                </div>
            </main>

            {isStudentModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-gray-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingStudent ? "Editar Alumno" : "Agregar Alumno"}
                            </h2>
                            <button onClick={() => setIsStudentModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        {!editingStudent && (
                            <div className="flex gap-2 px-6 pt-3 border-b border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setStudentModalTab('nuevo')}
                                    className={`px-4 py-2 text-sm font-semibold transition border-b-2 ${
                                        studentModalTab === 'nuevo'
                                            ? 'text-blue-600 border-blue-600'
                                            : 'text-gray-500 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    Nuevo alumno
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStudentModalTab('existente')}
                                    className={`px-4 py-2 text-sm font-semibold transition border-b-2 ${
                                        studentModalTab === 'existente'
                                            ? 'text-blue-600 border-blue-600'
                                            : 'text-gray-500 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    Alumno existente
                                </button>
                            </div>
                        )}

                        {!editingStudent && studentModalTab === 'existente' ? (
                            <div className="p-6">
                                <div className="relative mb-4">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={studentSearchQuery}
                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                        placeholder="Buscar por nombre o apellido..."
                                        className="w-full border border-gray-300 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                                    />
                                </div>
                                <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                                    {studentSearchResults.length === 0 ? (
                                        <p className="text-center text-sm text-gray-500 italic py-6 px-4">
                                            {studentSearchQuery.trim() === ""
                                                ? "No hay más alumnos disponibles para agregar."
                                                : "No se encontraron alumnos con ese nombre."}
                                        </p>
                                    ) : (
                                        studentSearchResults.map((student) => (
                                            <button
                                                type="button"
                                                key={student.id_discente}
                                                onClick={() => handleAddExistingStudent(student)}
                                                disabled={isAddingExistingStudent}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between gap-3 disabled:opacity-50"
                                            >
                                                <span className="text-gray-800 font-medium">
                                                    {student.Apellido_Paterno_Discente} {student.Apellido_Materno_Discente} {student.Nombre_Discente}
                                                </span>
                                                <Plus size={16} className="text-blue-600 shrink-0" />
                                            </button>
                                        ))
                                    )}
                                </div>
                                <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setIsStudentModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium">Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleStudentSubmit} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre(s)</label>
                                        <input
                                            value={studentFormData.Nombre_Discente}
                                            onChange={(e) => setStudentFormData({...studentFormData, Nombre_Discente: e.target.value})}
                                            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido Paterno</label>
                                        <input
                                            value={studentFormData.Apellido_Paterno_Discente}
                                            onChange={(e) => setStudentFormData({...studentFormData, Apellido_Paterno_Discente: e.target.value})}
                                            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido Materno</label>
                                        <input
                                            value={studentFormData.Apellido_Materno_Discente}
                                            onChange={(e) => setStudentFormData({...studentFormData, Apellido_Materno_Discente: e.target.value})}
                                            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setIsStudentModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium">Cancelar</button>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">{editingStudent ? "Guardar" : "Agregar"}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-gray-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingGroup ? "Editar Grupo" : "Nuevo Grupo"}
                            </h2>
                            <button onClick={() => setIsGroupModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleGroupSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Grupo / Materia</label>
                                    <input
                                        type="text"
                                        value={groupFormData.Nombre_Grupo}
                                        onChange={(e) => setGroupFormData({...groupFormData, Nombre_Grupo: e.target.value})}
                                        className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                                        placeholder="Ej. Matemáticas"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Grado (Solo número)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={groupFormData.Grado}
                                            onChange={(e) => setGroupFormData({...groupFormData, Grado: e.target.value})}
                                            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                                            placeholder="Ej. 1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Año</label>
                                        <input
                                            type="number"
                                            min="2000"
                                            value={groupFormData.Año}
                                            onChange={(e) => setGroupFormData({...groupFormData, Año: e.target.value})}
                                            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                                            placeholder="Ej. 2024"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
                                    {editingGroup ? "Guardar" : "Crear Grupo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isPlayModalOpen && selectedStudentForPlay && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden ring-1 ring-gray-200 flex flex-col max-h-[90vh]">

                        <div className="bg-blue-600 px-6 py-4 border-b border-gray-100 flex justify-between items-center text-white shrink-0">
                            <div>
                                <h2 className="text-xl font-bold">Configurar Partida</h2>
                                <p className="text-sm opacity-90">Alumno: {selectedStudentForPlay.Nombre_Discente}</p>
                            </div>
                            <button onClick={() => setIsPlayModalOpen(false)} className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/20">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">

                            {playStep === 1 && (
                                <div className="space-y-6 text-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Selecciona el modo de juego</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        <button
                                            onClick={() => {
                                                setIsPlayModalOpen(false);
                                                router.push(`/play/${selectedStudentForPlay.id_discente}?mode=historia`);
                                            }}
                                            className="p-6 border-2 border-amber-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all group"
                                        >
                                            <BookOpen size={40} className="mx-auto text-amber-400 group-hover:text-amber-600 mb-3" />
                                            <span className="block font-bold text-gray-800 text-lg">Modo Historia</span>
                                            <span className="text-sm text-gray-500 mt-2 block">Campaña predeterminada</span>
                                        </button>

                                        <button
                                            onClick={() => setPlayStep(2)}
                                            className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                        >
                                            <Edit size={40} className="mx-auto text-blue-400 group-hover:text-blue-600 mb-3" />
                                            <span className="block font-bold text-gray-800 text-lg">Modo Custom</span>
                                            <span className="text-sm text-gray-500 mt-2 block">Parámetros personalizados</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {playStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-md font-bold text-gray-700 mb-3">1. ¿Qué tipo de actividad es?</h3>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => setGameConfig({...gameConfig, type: 'prueba'})}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold transition-colors ${gameConfig.type === 'prueba' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-200'}`}
                                            >Prueba (Con tiempo)</button>
                                            <button
                                                onClick={() => setGameConfig({...gameConfig, type: 'repaso'})}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold transition-colors ${gameConfig.type === 'repaso' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-200'}`}
                                            >Repaso (Libre)</button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-md font-bold text-gray-700 mb-3">2. Selecciona el elemento</h3>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => setGameConfig({...gameConfig, element: 'tierra', operation: 'suma'})}
                                                style={{ backgroundImage: "url('/assets/bg_tierra.jpg')" }}
                                                className={`relative flex-1 py-8 rounded-lg border-2 font-bold bg-cover bg-center overflow-hidden transition-all ${gameConfig.element === 'tierra' ? 'border-orange-500 ring-2 ring-orange-400' : 'border-gray-200 hover:border-orange-300'}`}
                                            >
                                                <span className={`absolute inset-0 transition-colors ${gameConfig.element === 'tierra' ? 'bg-orange-900/30' : 'bg-black/40 hover:bg-black/25'}`} />
                                                <span className="relative z-10 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">Tierra (+, -)</span>
                                            </button>
                                            <button
                                                onClick={() => setGameConfig({...gameConfig, element: 'agua', operation: 'multiplicacion', numCifras: 2, cifras: ['', '']})}
                                                style={{ backgroundImage: "url('/assets/bg_agua.png')" }}
                                                className={`relative flex-1 py-8 rounded-lg border-2 font-bold bg-cover bg-center overflow-hidden transition-all ${gameConfig.element === 'agua' ? 'border-cyan-500 ring-2 ring-cyan-400' : 'border-gray-200 hover:border-cyan-300'}`}
                                            >
                                                <span className={`absolute inset-0 transition-colors ${gameConfig.element === 'agua' ? 'bg-cyan-900/30' : 'bg-black/40 hover:bg-black/25'}`} />
                                                <span className="relative z-10 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">Agua (x, ÷)</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                                        <button onClick={() => setPlayStep(1)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Atrás</button>
                                        <button
                                            disabled={!gameConfig.type || !gameConfig.element}
                                            onClick={() => setPlayStep(3)}
                                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >Siguiente</button>
                                    </div>
                                </div>
                            )}

                            {playStep === 3 && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const encodedConfig = encodeURIComponent(JSON.stringify(gameConfig));
                                    router.push(`/play/${selectedStudentForPlay.id_discente}?mode=custom&config=${encodedConfig}`);
                                    setIsPlayModalOpen(false);
                                }}>
                                    <div className="space-y-5">

                                        {gameConfig.element === 'agua' && (
                                            <div className="bg-cyan-50 border-l-4 border-cyan-500 p-3 mb-4 text-sm text-cyan-800 font-medium">
                                                <p>Recuerda que la multiplicación puede ser de hasta 3x2 dígitos.</p>
                                                <p>Recuerda que en la división el cociente puede ser de hasta 3 dígitos.</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Operación</label>
                                                <select
                                                    value={gameConfig.operation}
                                                    onChange={(e) => setGameConfig({...gameConfig, operation: e.target.value})}
                                                    className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {gameConfig.element === 'tierra' ? (
                                                        <><option value="suma">Suma</option><option value="resta">Resta</option></>
                                                    ) : (
                                                        <><option value="multiplicacion">Multiplicación</option><option value="division">División</option></>
                                                    )}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Límite de Tiempo</label>
                                                {gameConfig.type === 'prueba' ? (
                                                    <input
                                                        type="number" placeholder="Segundos" required
                                                        value={gameConfig.timeLimit}
                                                        onChange={(e) => setGameConfig({...gameConfig, timeLimit: e.target.value})}
                                                        className="w-full border border-gray-300 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                ) : (
                                                    <input type="text" disabled value="Sin límite de tiempo" className="w-full border border-gray-200 px-4 py-2 rounded-lg bg-gray-100 text-gray-500" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            {gameConfig.element === 'tierra' ? (
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm font-semibold text-gray-700">Cantidad de cifras a operar (1-5):</label>
                                                    <input
                                                        type="number" min="1" max="5" required
                                                        value={gameConfig.numCifras}
                                                        onChange={(e) => {
                                                            const num = parseInt(e.target.value) || 1;
                                                            const finalNum = num > 5 ? 5 : num;
                                                            setGameConfig({...gameConfig, numCifras: finalNum, cifras: Array(finalNum).fill('')});
                                                        }}
                                                        className="w-20 border border-gray-300 px-2 py-1 rounded text-center focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="mb-3">
                                                    <label className="text-sm font-semibold text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full inline-block">
                                                        Operación de Agua (Fijado a 2 cifras)
                                                    </label>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                {gameConfig.cifras.map((cifra, idx) => (
                                                    <input
                                                        key={`cifra-${idx}`} type="number" required placeholder={`N° ${idx + 1}`}
                                                        value={cifra}
                                                        onChange={(e) => {
                                                            const newCifras = [...gameConfig.cifras];
                                                            newCifras[idx] = e.target.value;
                                                            setGameConfig({...gameConfig, cifras: newCifras});
                                                        }}
                                                        className="w-full border border-gray-300 px-2 py-2 rounded text-center outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Resultado
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={gameConfig.resultado}
                                                className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold cursor-not-allowed outline-none"
                                                placeholder="Esperando a que llenes las cifras..."
                                            />
                                        </div>

                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-sm font-semibold text-red-700">
                                                    Cantidad de números trampa (Máximo 4):
                                                </label>
                                                <input
                                                    type="number" min="0" max="4" required
                                                    value={gameConfig.numTrampas}
                                                    onChange={(e) => {
                                                        const num = parseInt(e.target.value) || 0;
                                                        const finalNum = num > 4 ? 4 : num;

                                                        setGameConfig({...gameConfig, numTrampas: finalNum, trampas: Array(finalNum).fill('')});
                                                    }}
                                                    className="w-20 border border-red-300 px-2 py-1 rounded text-center outline-none focus:ring-2 focus:ring-red-500"
                                                />
                                            </div>

                                            {gameConfig.numTrampas > 0 && (
                                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                    {gameConfig.trampas.map((trampa, idx) => (
                                                        <input
                                                            key={`trampa-${idx}`} type="number" required placeholder={`Trampa ${idx + 1}`}
                                                            value={trampa}
                                                            onChange={(e) => {
                                                                const newTrampas = [...gameConfig.trampas];
                                                                newTrampas[idx] = e.target.value;
                                                                setGameConfig({...gameConfig, trampas: newTrampas});
                                                            }}
                                                            className="w-full border border-red-300 px-2 py-2 rounded text-center outline-none focus:ring-2 focus:ring-red-500"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 shrink-0">
                                        <button type="button" onClick={() => setPlayStep(2)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Atrás</button>
                                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                                            <Play size={18} fill="currentColor" /> Iniciar Partida
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {studentToDelete && (
                <ConfirmDeleteModal
                    title="Quitar del grupo"
                    isDeleting={isDeletingStudent}
                    onConfirm={confirmDeleteStudent}
                    onCancel={() => setStudentToDelete(null)}
                    message={
                        <>
                            ¿Estás seguro de que deseas quitar a{" "}
                            <span className="font-semibold">
                                {studentToDelete.Nombre_Discente} {studentToDelete.Apellido_Paterno_Discente}
                            </span>{" "}
                            de este grupo? El alumno seguirá existiendo en el sistema y podrás
                            volver a agregarlo después. Para eliminarlo por completo, contacta
                            a un administrador.
                        </>
                    }
                />
            )}

            {groupToDelete && (
                <ConfirmDeleteModal
                    title="Eliminar Grupo"
                    isDeleting={isDeletingGroup}
                    onConfirm={confirmDeleteGroup}
                    onCancel={() => setGroupToDelete(null)}
                    message={
                        <>
                            ¿Estás seguro de que deseas eliminar el grupo{" "}
                            <span className="font-semibold">
                                {groupToDelete.Grado}° - {groupToDelete.Nombre_Grupo} ({groupToDelete.Año})
                            </span>
                            ? Se perderá el acceso a sus alumnos. Esta acción no se puede deshacer.
                        </>
                    }
                />
            )}

            {showGroupProgressModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setShowGroupProgressModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto text-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp size={18} /> Avance del grupo
                            </h3>
                            <button
                                onClick={() => setShowGroupProgressModal(false)}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {isLoadingGroupStats ? (
                                <div className="py-16 flex justify-center text-gray-400">
                                    <Loader2 size={24} className="animate-spin" />
                                </div>
                            ) : groupAveragesChartData.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-10">
                                    Este grupo todavía no tiene partidas registradas.
                                </p>
                            ) : (
                                <>
                                    <div className="mb-8">
                                        <h4 className="font-semibold text-gray-700 mb-1">Promedio del grupo por día</h4>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Puntaje promedio (0-100) y dificultad promedio (1-3) de todos los alumnos
                                            del grupo. Las partidas en modo personalizado no se cuentan en la
                                            dificultad promedio, ya que no forman parte de esa escala.
                                        </p>
                                        <div className="w-full h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={groupAveragesChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                                                    <YAxis yAxisId="puntos" domain={[0, 100]} tick={{ fontSize: 12 }} />
                                                    <YAxis yAxisId="dificultad" orientation="right" domain={[0, 4]} allowDecimals={false} tick={{ fontSize: 12 }} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line yAxisId="puntos" type="monotone" dataKey="puntos" name="Puntaje promedio" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                                                    <Line yAxisId="dificultad" type="monotone" dataKey="dificultad" name="Dificultad promedio" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Desempeño actual por alumno</h4>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Un punto por alumno, ubicado por su puntaje y dificultad promedio
                                            acumulados: entre más abajo a la izquierda, más apoyo necesita; entre
                                            más arriba a la derecha, mejor le va. Pasa el cursor sobre un punto
                                            para ver de quién se trata.
                                        </p>
                                        <div className="w-full h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ScatterChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis
                                                        type="number" dataKey="avgPuntos" name="Puntaje promedio"
                                                        domain={[0, 100]} tick={{ fontSize: 12 }}
                                                        label={{ value: 'Puntaje promedio', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#6b7280' }}
                                                    />
                                                    <YAxis
                                                        type="number" dataKey="avgDificultad" name="Dificultad promedio"
                                                        domain={[0.5, 3.5]} tick={{ fontSize: 12 }}
                                                        label={{ value: 'Dificultad promedio', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#6b7280' }}
                                                    />
                                                    <ReferenceLine x={50} stroke="#d1d5db" strokeDasharray="4 4" />
                                                    <ReferenceLine y={2} stroke="#d1d5db" strokeDasharray="4 4" />
                                                    <Tooltip content={<StudentScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                                    <Scatter data={groupStats?.perStudent || []} fill="#7c3aed" />
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}