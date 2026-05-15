"use client";
import { useState, useEffect } from "react";
import {
    Edit, Trash2, Play, BarChart2, Plus, X,
    Users, ChevronDown, ChevronRight, BookOpen, Edit2, Trash, LogOut
} from "lucide-react";
import IconButton from "../components/IconButton";
import { useRouter } from "next/navigation";
import axios from "axios";

// --- INTERFACES ---
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
    grupos?: Group[]; // CORRECCIÓN: Ahora el alumno sabe a qué grupos pertenece
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

export default function Dashboard() {
    const router = useRouter();
    const ID_DOCENTE_ACTUAL = 6;

    // --- ESTADOS DE ALUMNOS ---
    const [students, setStudents] = useState<Student[]>([]);
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

    // --- ESTADOS DE GRUPOS ---
    const [groups, setGroups] = useState<Group[]>([]);
    const [isGroupsSidebarOpen, setIsGroupsSidebarOpen] = useState(true);
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupFormData, setGroupFormData] = useState({ Nombre_Grupo: "", Año: "", Grado: "" });

    useEffect(() => {
        fetchStudents();
        fetchGroups();
        // Solo calculamos si todas las cifras requeridas están llenas
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

            // Redondeamos a 2 decimales si la división no es exacta
            const formattedResult = Number.isInteger(calculatedResult)
                ? String(calculatedResult)
                : calculatedResult.toFixed(2);

            // Actualizamos el estado solo si el resultado es diferente para evitar ciclos infinitos
            if (formattedResult !== gameConfig.resultado) {
                setGameConfig(prev => ({ ...prev, resultado: formattedResult }));
            }
        } else if (gameConfig.resultado !== "") {
            // Si el docente borra un número, limpiamos el resultado
            setGameConfig(prev => ({ ...prev, resultado: "" }));
        }
    }, [gameConfig.cifras, gameConfig.operation, gameConfig.numCifras]);

    const fetchStudents = async () => {
        try {
            const res = await axios.get("http://localhost:3001/discentes");
            setStudents(res.data);
        } catch (error) {
            console.error("Error al cargar alumnos", error);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await axios.get("http://localhost:3001/groups");
            setGroups(res.data);
            if (res.data.length > 0 && !activeGroupId) {
                setActiveGroupId(res.data[0].id_grupo);
            }
        } catch (error) {
            console.error("Error al cargar grupos", error);
        }
    };

    // Solo nos quedamos con los alumnos que tengan el ID del grupo activo
    const filteredStudents = students.filter(student =>
        student.grupos?.some(g => g.id_grupo === activeGroupId)
    );

    // --- MANEJADORES DE ALUMNOS (CRUD) ---
    const handleOpenAddStudent = () => {
        setEditingStudent(null);
        setStudentFormData({ Nombre_Discente: "", Apellido_Paterno_Discente: "", Apellido_Materno_Discente: "" });
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
                await axios.patch(`http://localhost:3001/discentes/${editingStudent.id_discente}`, payload);
            } else {
                await axios.post("http://localhost:3001/discentes", payload);
            }
            setIsStudentModalOpen(false);
            fetchStudents();
        } catch (error) {
            console.error("Error al guardar alumno", error);
            alert("Error al guardar en la base de datos.");
        }
    };

    const handleDeleteStudent = async (id_discente: number) => {
        if(!confirm("¿Estás seguro de eliminar este alumno?")) return;
        try {
            await axios.delete(`http://localhost:3001/discentes/${id_discente}`);
            fetchStudents();
        } catch (error) {
            console.error("Error al eliminar alumno", error);
        }
    };

    // --- MANEJADORES DE GRUPOS (CRUD COMPLETO CON BACKEND) ---
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

        const payload = {
            Nombre_Grupo: groupFormData.Nombre_Grupo,
            Año: Number(groupFormData.Año),
            Grado: Number(groupFormData.Grado),
            docente: { id_docente: ID_DOCENTE_ACTUAL }
        };

        try {
            if (editingGroup) {
                await axios.patch(`http://localhost:3001/groups/${editingGroup.id_grupo}`, payload);
            } else {
                await axios.post("http://localhost:3001/groups", payload);
            }
            setIsGroupModalOpen(false);
            fetchGroups();
        } catch (error) {
            console.error("Error al guardar grupo", error);
            alert("Error al guardar el grupo en la base de datos.");
        }
    };

    const handleDeleteGroup = async (e: React.MouseEvent, id_grupo: number) => {
        e.stopPropagation();
        if(confirm("¿Eliminar este grupo completo? Se perderá el acceso a sus alumnos.")) {
            try {
                await axios.delete(`http://localhost:3001/groups/${id_grupo}`);
                if (activeGroupId === id_grupo) setActiveGroupId(null);
                fetchGroups();
            } catch (error) {
                console.error("Error al eliminar grupo", error);
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-black overflow-hidden relative">

            {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
            <aside className="w-72 bg-gray-900 text-white flex flex-col shadow-2xl z-10">
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
                                            <strong className="font-medium text-gray-200">{group.Grado}°</strong> - {group.Nombre_Grupo}
                                        </span>

                                        <div className="hidden group-hover:flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleOpenEditGroup(e, group)}
                                                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-400"
                                            >
                                                <Edit2 size={14}/>
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteGroup(e, group.id_grupo)}
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
                        P
                    </div>
                    <div className="flex flex-col items-start">
                        <p className="font-semibold text-gray-200">Profesor</p>
                        <button
                            onClick={() => router.push('/')}
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors mt-0.5 flex items-center gap-1"
                        >
                            <LogOut size={12} /> Cerrar sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* ================= CONTENIDO PRINCIPAL ================= */}
            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="max-w-6xl mx-auto">

                    <header className="flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                {activeGroupId && groups.find(g => g.id_grupo === activeGroupId)
                                    ? `${groups.find(g => g.id_grupo === activeGroupId)?.Grado}° - ${groups.find(g => g.id_grupo === activeGroupId)?.Nombre_Grupo}`
                                    : "Selecciona un grupo"}
                            </h1>
                            <p className="text-gray-500 mt-1">Gestión de alumnos inscritos</p>
                        </div>
                        {activeGroupId && (
                            <button
                                onClick={handleOpenAddStudent}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-lg font-medium"
                            >
                                <Plus size={20} /> Agregar Alumno
                            </button>
                        )}
                    </header>

                    {/* Tabla de Alumnos */}
                    {activeGroupId ? (
                        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                            <table className="min-w-full leading-normal">
                                <thead>
                                <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-wider">
                                    <th className="py-4 px-6 text-left border-b border-gray-200">Nombre Completo</th>
                                    <th className="py-4 px-6 text-center border-b border-gray-200">Acciones</th>
                                </tr>
                                </thead>
                                <tbody className="text-gray-700 text-sm">
                                {/* CORRECCIÓN: Usamos filteredStudents en lugar de todos los students */}
                                {filteredStudents.length === 0 ? (
                                    <tr><td colSpan={2} className="text-center py-8 text-gray-500 italic">No hay alumnos en este grupo</td></tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id_discente} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                                            <td className="py-4 px-6 text-left font-medium">
                                                {student.Apellido_Paterno_Discente} {student.Apellido_Materno_Discente} {student.Nombre_Discente}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex item-center justify-center gap-3">
                                                    <IconButton icon={<Edit size={18} />} label="Modificar" onClick={() => handleOpenEditStudent(student)} color="text-blue-500" />
                                                    <IconButton icon={<Trash2 size={18} />} label="Eliminar" onClick={() => handleDeleteStudent(student.id_discente)} color="text-red-500" />
                                                    <IconButton
                                                        icon={<Play size={18} />}
                                                        label="Jugar"
                                                        onClick={() => {
                                                            setSelectedStudentForPlay(student);
                                                            setPlayStep(1); // Reiniciar al paso 1
                                                            setGameConfig({ mode: null, type: null, element: null, operation: 'suma', timeLimit: '', numCifras: 2, cifras: ['', ''], resultado: '', numTrampas: 1, trampas: [''] });
                                                            setIsPlayModalOpen(true);
                                                        }}
                                                        color="text-purple-500"
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
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Users size={48} className="mb-4 text-gray-300"/>
                            <p className="text-lg">Selecciona un grupo en la barra lateral para ver sus alumnos.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* ================= MODAL DE ALUMNO ================= */}
            {isStudentModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-gray-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingStudent ? "Editar Alumno" : "Nuevo Alumno"}
                            </h2>
                            <button onClick={() => setIsStudentModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>
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
                    </div>
                </div>
            )}

            {/* ================= MODAL DE GRUPO (NUEVO) ================= */}
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
            {/* ================= MODAL DE CONFIGURACIÓN DE JUEGO ================= */}
            {isPlayModalOpen && selectedStudentForPlay && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden ring-1 ring-gray-200 flex flex-col max-h-[90vh]">

                        {/* Cabecera del Modal */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 border-b border-gray-100 flex justify-between items-center text-white shrink-0">
                            <div>
                                <h2 className="text-xl font-bold">Configurar Partida</h2>
                                <p className="text-sm opacity-90">Alumno: {selectedStudentForPlay.Nombre_Discente}</p>
                            </div>
                            <button onClick={() => setIsPlayModalOpen(false)} className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/20">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Contenido con Scroll */}
                        <div className="p-6 overflow-y-auto flex-1">

                            {/* PASO 1: MODO DE JUEGO */}
                            {playStep === 1 && (
                                <div className="space-y-6 text-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Selecciona el modo de juego</h3>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <button
                                            onClick={() => {
                                                setIsPlayModalOpen(false);
                                                // MODO HISTORIA: Redirige directo
                                                router.push(`/play/${selectedStudentForPlay.id_discente}?mode=historia`);
                                            }}
                                            className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                                        >
                                            <BookOpen size={40} className="mx-auto text-purple-400 group-hover:text-purple-600 mb-3" />
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

                            {/* PASO 2: TIPO Y ELEMENTO */}
                            {playStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-md font-bold text-gray-700 mb-3">1. ¿Qué tipo de actividad es?</h3>
                                        <div className="flex gap-4">
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
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setGameConfig({...gameConfig, element: 'tierra', operation: 'suma'})}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold transition-colors ${gameConfig.element === 'tierra' ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-gray-200 text-gray-500 hover:border-orange-200'}`}
                                            >Tierra (+, -)</button>
                                            <button
                                                onClick={() => setGameConfig({...gameConfig, element: 'agua', operation: 'multiplicacion', numCifras: 2, cifras: ['', '']})}
                                                className={`flex-1 py-3 rounded-lg border-2 font-bold transition-colors ${gameConfig.element === 'agua' ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-gray-200 text-gray-500 hover:border-cyan-200'}`}
                                            >Agua (x, ÷)</button>
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

                            {/* PASO 3: FORMULARIO DETALLADO */}
                            {playStep === 3 && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    // Comprimir la configuración en la URL para enviarla al juego
                                    const encodedConfig = encodeURIComponent(JSON.stringify(gameConfig));
                                    router.push(`/play/${selectedStudentForPlay.id_discente}?mode=custom&config=${encodedConfig}`);
                                    setIsPlayModalOpen(false);
                                }}>
                                    <div className="space-y-5">

                                        {/* Avisos Especiales para Agua */}
                                        {gameConfig.element === 'agua' && (
                                            <div className="bg-cyan-50 border-l-4 border-cyan-500 p-3 mb-4 text-sm text-cyan-800 font-medium">
                                                <p>Recuerda que la multiplicación puede ser de hasta 3x2 dígitos.</p>
                                                <p>Recuerda que en la división el cociente puede ser de hasta 3 dígitos.</p>
                                            </div>
                                        )}

                                        {/* Operación y Tiempo */}
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

                                        {/* Cifras de la ecuación */}
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            {/* Si es Tierra mostramos el selector, si es Agua mostramos un texto fijo */}
                                            {gameConfig.element === 'tierra' ? (
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm font-semibold text-gray-700">Cantidad de cifras a operar (1-5):</label>
                                                    <input
                                                        type="number" min="1" max="5" required
                                                        value={gameConfig.numCifras}
                                                        onChange={(e) => {
                                                            const num = parseInt(e.target.value) || 1;
                                                            const finalNum = num > 5 ? 5 : num; // Limitar a 5
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

                                            <div className="grid grid-cols-5 gap-2">
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

                                        {/* Resultado Esperado (Autocalculado) */}
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

                                        {/* Números Trampa */}
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
                                                        // Validamos el límite de 4 para CUALQUIER elemento
                                                        const finalNum = num > 4 ? 4 : num;

                                                        setGameConfig({...gameConfig, numTrampas: finalNum, trampas: Array(finalNum).fill('')});
                                                    }}
                                                    className="w-20 border border-red-300 px-2 py-1 rounded text-center outline-none focus:ring-2 focus:ring-red-500"
                                                />
                                            </div>

                                            {gameConfig.numTrampas > 0 && (
                                                <div className="grid grid-cols-5 gap-2">
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

                                    {/* Botones Finales */}
                                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 shrink-0">
                                        <button type="button" onClick={() => setPlayStep(2)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Atrás</button>
                                        <button type="submit" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                                            <Play size={18} fill="currentColor" /> Iniciar Partida
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}