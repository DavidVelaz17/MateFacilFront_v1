"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/config/api";
import { Edit, Trash2, Plus, X, ShieldAlert, Users, LogOut, Menu, Loader2 } from "lucide-react";
import IconButton from "../components/IconButton";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";

interface Teacher {
    id_docente: number;
    Nombre_Docente: string;
    Apellido_Paterno_Docente: string;
    Apellido_Materno_Docente: string;
    Usuario: string;
    Password?: string;
}

export default function AdminDashboard() {
    const { docenteId, logout } = useAuth();
    const { showToast } = useToast();

    // --- ESTADOS ---
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Estados para el modal de confirmacion de borrado
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [deleteImpact, setDeleteImpact] = useState<{ groupsCount: number; groupNames: string[]; studentsCount: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        Nombre_Docente: "",
        Apellido_Paterno_Docente: "",
        Apellido_Materno_Docente: "",
        Usuario: "",
        Password: ""
    });

    // --- EFECTOS ---
    // Una vez que useAuth confirma la sesion (docenteId listo), cargamos los docentes
    useEffect(() => {
        if (docenteId !== null) {
            fetchTeachers();
        }
    }, [docenteId]);

    // --- MANEJADORES DE BASE DE DATOS (AXIOS) ---
    const fetchTeachers = async () => {
        setIsLoadingTeachers(true);
        try {
            const response = await api.get("/teachers");
            setTeachers(response.data);
        } catch (error) {
            console.error("Error al cargar docentes desde la BD:", error);
            showToast("No se pudieron cargar los docentes.", "error");
        } finally {
            setIsLoadingTeachers(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingTeacher(null);
        setFormData({
            Nombre_Docente: "",
            Apellido_Paterno_Docente: "",
            Apellido_Materno_Docente: "",
            Usuario: "",
            Password: ""
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            Nombre_Docente: teacher.Nombre_Docente,
            Apellido_Paterno_Docente: teacher.Apellido_Paterno_Docente,
            Apellido_Materno_Docente: teacher.Apellido_Materno_Docente,
            Usuario: teacher.Usuario,
            Password: "" // Contraseña vacía por seguridad
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTeacher) {
                // MODO EDICIÓN
                await api.patch(`/teachers/${editingTeacher.id_docente}`, formData);
            } else {
                // MODO CREACIÓN
                await api.post("/teachers", formData);
            }
            setIsModalOpen(false);
            showToast(editingTeacher ? "Docente actualizado correctamente." : "Docente creado correctamente.", "success");
            fetchTeachers(); // Recargar la tabla con los datos nuevos
        } catch (error) {
            console.error("Error al guardar docente:", error);
            const mensaje = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            showToast(Array.isArray(mensaje) ? mensaje[0] : mensaje || "Hubo un error al guardar el docente.", "error");
        }
    };

    const handleDelete = async (teacher: Teacher) => {
        try {
            const response = await api.get(`/teachers/${teacher.id_docente}/delete-impact`);
            setDeleteImpact(response.data);
        } catch (error) {
            console.error("Error al consultar el impacto de la eliminación:", error);
            setDeleteImpact({ groupsCount: 0, groupNames: [], studentsCount: 0 });
        }
        setTeacherToDelete(teacher);
    };

    const confirmDelete = async () => {
        if (!teacherToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/teachers/${teacherToDelete.id_docente}`);
            setTeacherToDelete(null);
            setDeleteImpact(null);
            showToast("Docente eliminado.", "success");
            fetchTeachers(); // Recargar la tabla sin el docente eliminado
        } catch (error) {
            console.error("Error al eliminar docente:", error);
            showToast("Hubo un error al eliminar el docente.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-black overflow-hidden relative">

            {/* Overlay para cerrar la barra lateral en movil */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ================= BARRA LATERAL ================= */}
            <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white flex flex-col shadow-2xl transform transition-transform duration-200 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-500/30">
                        <ShieldAlert size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-wide">Admin Portal</h2>
                        <p className="text-xs text-slate-400">Superusuario</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-2">
                        <li className="flex items-center gap-3 p-3 bg-red-600/20 text-red-400 border-l-4 border-red-500 rounded-lg cursor-pointer">
                            <Users size={20} />
                            <span className="font-semibold">Gestión de Docentes</span>
                        </li>
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-800 text-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">A</div>
                    <div className="flex flex-col items-start">
                        <p className="font-semibold text-slate-200">Administrador</p>
                        <button onClick={logout} className="text-xs text-slate-400 hover:text-red-400 transition-colors mt-0.5 flex items-center gap-1">
                            <LogOut size={12} /> Cerrar sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* ================= CONTENIDO PRINCIPAL ================= */}
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
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Directorio de Docentes</h1>
                                <p className="text-gray-500 mt-1">Administra los accesos de los profesores a la plataforma</p>
                            </div>
                        </div>
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-900 transition shadow-lg font-medium shrink-0"
                        >
                            <Plus size={20} /> Registrar Docente
                        </button>
                    </header>

                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
                                <th className="py-4 px-6 text-left border-b border-gray-200">Nombre Completo</th>
                                <th className="py-4 px-6 text-left border-b border-gray-200">Usuario de Acceso</th>
                                <th className="py-4 px-6 text-center border-b border-gray-200">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm">
                            {isLoadingTeachers ? (
                                <tr><td colSpan={3} className="text-center py-10 text-gray-400"><Loader2 size={22} className="animate-spin mx-auto" /></td></tr>
                            ) : teachers.length === 0 ? (
                                <tr><td colSpan={3} className="text-center py-8 text-gray-500 italic">No hay docentes registrados</td></tr>
                            ) : (
                                teachers.map((teacher) => (
                                    <tr key={teacher.id_docente} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 text-left font-medium">
                                            {teacher.Apellido_Paterno_Docente} {teacher.Apellido_Materno_Docente} {teacher.Nombre_Docente}
                                        </td>
                                        <td className="py-4 px-6 text-left">
                                            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-mono">
                                              {teacher.Usuario}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex item-center justify-center gap-3">
                                                <IconButton icon={<Edit size={18} />} label="Modificar" onClick={() => handleOpenEdit(teacher)} color="text-blue-500" />
                                                <IconButton icon={<Trash2 size={18} />} label="Eliminar" onClick={() => handleDelete(teacher)} color="text-red-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* ================= MODAL DE DOCENTE ================= */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden ring-1 ring-gray-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <ShieldAlert size={20} className="text-red-500"/>
                                {editingTeacher ? "Editar Cuenta Docente" : "Nuevo Docente"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre(s)</label>
                                    {/* CORRECCIÓN: value y onChange ahora apuntan a Nombre_Docente */}
                                    <input value={formData.Nombre_Docente} onChange={(e) => setFormData({...formData, Nombre_Docente: e.target.value})} className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-gray-900 bg-white" required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido Paterno</label>
                                        <input value={formData.Apellido_Paterno_Docente} onChange={(e) => setFormData({...formData, Apellido_Paterno_Docente: e.target.value})} className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-gray-900 bg-white" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido Materno</label>
                                        <input value={formData.Apellido_Materno_Docente} onChange={(e) => setFormData({...formData, Apellido_Materno_Docente: e.target.value})} className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-gray-900 bg-white" required />
                                    </div>
                                </div>
                                <hr className="my-4 border-gray-100" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Usuario</label>
                                        <input value={formData.Usuario} onChange={(e) => setFormData({...formData, Usuario: e.target.value})} className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-900 bg-slate-50 font-mono text-sm" placeholder="ej. perez.juan" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Contraseña {editingTeacher && <span className="text-xs text-gray-400 font-normal">(Vacío = no cambiar)</span>}
                                        </label>
                                        <input type="password" value={formData.Password} onChange={(e) => setFormData({...formData, Password: e.target.value})} className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-900 bg-white" placeholder="******" required={!editingTeacher} minLength={4} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition shadow-md">
                                    {editingTeacher ? "Guardar Cambios" : "Crear Docente"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL DE CONFIRMACIÓN DE BORRADO ================= */}
            {teacherToDelete && (
                <ConfirmDeleteModal
                    title="Eliminar Docente"
                    isDeleting={isDeleting}
                    onConfirm={confirmDelete}
                    onCancel={() => { setTeacherToDelete(null); setDeleteImpact(null); }}
                    message={
                        <>
                            ¿Estás seguro de que deseas eliminar a{" "}
                            <span className="font-semibold">
                                {teacherToDelete.Nombre_Docente} {teacherToDelete.Apellido_Paterno_Docente}
                            </span>{" "}
                            del sistema? Esta acción no se puede deshacer.
                        </>
                    }
                    extraContent={
                        deleteImpact && deleteImpact.groupsCount > 0 && (
                            <p className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
                                Este docente tiene <span className="font-bold">{deleteImpact.groupsCount}</span> grupo(s)
                                {deleteImpact.groupNames.length > 0 && <> ({deleteImpact.groupNames.join(", ")})</>} con{" "}
                                <span className="font-bold">{deleteImpact.studentsCount}</span> alumno(s) vinculado(s).
                                Se eliminarán esos grupos y se desvincularán sus alumnos.
                            </p>
                        )
                    }
                />
            )}
        </div>
    );
}