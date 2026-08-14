"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/config/api";
import { Edit, Trash2, Plus, X, ShieldAlert, Users, LogOut, Menu, Loader2, GraduationCap, UserCheck, UserX } from "lucide-react";
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

interface Student {
    id_discente: number;
    Nombre_Discente: string;
    Apellido_Paterno_Discente: string;
    Apellido_Materno_Discente: string;
    Activo?: boolean;
}

export default function AdminDashboard() {
    const { docenteId, logout } = useAuth();
    const { showToast } = useToast();

    const [activeView, setActiveView] = useState<'docentes' | 'alumnos'>('docentes');

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [studentFormData, setStudentFormData] = useState({
        Nombre_Discente: "",
        Apellido_Paterno_Discente: "",
        Apellido_Materno_Discente: ""
    });
    const [togglingStudentId, setTogglingStudentId] = useState<number | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [isDeletingStudent, setIsDeletingStudent] = useState(false);

    // Espera a que useAuth confirme la sesion (docenteId listo) antes de cargar datos.
    useEffect(() => {
        if (docenteId !== null) {
            fetchTeachers();
            fetchStudents();
        }
    }, [docenteId]);

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
                await api.patch(`/teachers/${editingTeacher.id_docente}`, formData);
            } else {
                await api.post("/teachers", formData);
            }
            setIsModalOpen(false);
            showToast(editingTeacher ? "Docente actualizado correctamente." : "Docente creado correctamente.", "success");
            fetchTeachers();
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
            fetchTeachers();
        } catch (error) {
            console.error("Error al eliminar docente:", error);
            showToast("Hubo un error al eliminar el docente.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchStudents = async () => {
        setIsLoadingStudents(true);
        try {
            const response = await api.get("/discentes");
            setStudents(response.data);
        } catch (error) {
            console.error("Error al cargar alumnos desde la BD:", error);
            showToast("No se pudieron cargar los alumnos.", "error");
        } finally {
            setIsLoadingStudents(false);
        }
    };

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
        try {
            if (editingStudent) {
                await api.patch(`/discentes/${editingStudent.id_discente}`, studentFormData);
            } else {
                await api.post("/discentes", studentFormData);
            }
            setIsStudentModalOpen(false);
            showToast(editingStudent ? "Alumno actualizado correctamente." : "Alumno creado correctamente.", "success");
            fetchStudents();
        } catch (error) {
            console.error("Error al guardar alumno:", error);
            const mensaje = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            showToast(Array.isArray(mensaje) ? mensaje[0] : mensaje || "Hubo un error al guardar el alumno.", "error");
        }
    };

    // A diferencia de eliminar, dar de baja es reversible y conserva el historial.
    const handleToggleActiveStudent = async (student: Student) => {
        setTogglingStudentId(student.id_discente);
        try {
            const isCurrentlyActive = student.Activo !== false;
            const nextActivo = !isCurrentlyActive;
            await api.patch(`/discentes/${student.id_discente}`, { Activo: nextActivo });
            showToast(nextActivo ? "Alumno reactivado." : "Alumno dado de baja.", "success");
            fetchStudents();
        } catch (error) {
            console.error("Error al cambiar el estado del alumno:", error);
            showToast("Hubo un error al actualizar el estado del alumno.", "error");
        } finally {
            setTogglingStudentId(null);
        }
    };

    const confirmDeleteStudent = async () => {
        if (!studentToDelete) return;
        setIsDeletingStudent(true);
        try {
            await api.delete(`/discentes/${studentToDelete.id_discente}`);
            setStudentToDelete(null);
            showToast("Alumno eliminado.", "success");
            fetchStudents();
        } catch (error) {
            console.error("Error al eliminar alumno:", error);
            showToast("Hubo un error al eliminar el alumno.", "error");
        } finally {
            setIsDeletingStudent(false);
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
                        <li
                            onClick={() => { setActiveView('docentes'); setIsSidebarOpen(false); }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-l-4 transition-colors ${
                                activeView === 'docentes'
                                    ? "bg-red-600/20 text-red-400 border-red-500"
                                    : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        >
                            <Users size={20} />
                            <span className="font-semibold">Gestión de Docentes</span>
                        </li>
                        <li
                            onClick={() => { setActiveView('alumnos'); setIsSidebarOpen(false); }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-l-4 transition-colors ${
                                activeView === 'alumnos'
                                    ? "bg-red-600/20 text-red-400 border-red-500"
                                    : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        >
                            <GraduationCap size={20} />
                            <span className="font-semibold">Gestión de Alumnos</span>
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

            <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
                <div className="max-w-6xl mx-auto">

                    {activeView === 'docentes' ? (
                        <>
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
                        </>
                    ) : (
                        <>
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
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Directorio de Alumnos</h1>
                                        <p className="text-gray-500 mt-1">Administra los registros de alumnos de toda la plataforma</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleOpenAddStudent}
                                    className="flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-900 transition shadow-lg font-medium shrink-0"
                                >
                                    <Plus size={20} /> Agregar Alumno
                                </button>
                            </header>

                            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                <table className="min-w-full leading-normal">
                                    <thead>
                                    <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
                                        <th className="py-4 px-6 text-left border-b border-gray-200">Nombre Completo</th>
                                        <th className="py-4 px-6 text-left border-b border-gray-200">Estado</th>
                                        <th className="py-4 px-6 text-center border-b border-gray-200">Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody className="text-gray-700 text-sm">
                                    {isLoadingStudents ? (
                                        <tr><td colSpan={3} className="text-center py-10 text-gray-400"><Loader2 size={22} className="animate-spin mx-auto" /></td></tr>
                                    ) : students.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-8 text-gray-500 italic">No hay alumnos registrados</td></tr>
                                    ) : (
                                        students.map((student) => {
                                            const isActive = student.Activo !== false;
                                            return (
                                                <tr key={student.id_discente} className={`border-b border-gray-100 hover:bg-slate-50 transition-colors ${!isActive ? "opacity-60" : ""}`}>
                                                    <td className="py-4 px-6 text-left font-medium">
                                                        {student.Apellido_Paterno_Discente} {student.Apellido_Materno_Discente} {student.Nombre_Discente}
                                                    </td>
                                                    <td className="py-4 px-6 text-left">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                                                        }`}>
                                                            {isActive ? "Activo" : "Dado de baja"}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="flex item-center justify-center gap-3">
                                                            <IconButton icon={<Edit size={18} />} label="Modificar" onClick={() => handleOpenEditStudent(student)} color="text-blue-500" />
                                                            <IconButton
                                                                icon={togglingStudentId === student.id_discente
                                                                    ? <Loader2 size={18} className="animate-spin" />
                                                                    : isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                                                                label={isActive ? "Dar de baja" : "Reactivar"}
                                                                onClick={() => handleToggleActiveStudent(student)}
                                                                color={isActive ? "text-amber-500" : "text-emerald-600"}
                                                            />
                                                            <IconButton icon={<Trash2 size={18} />} label="Eliminar" onClick={() => setStudentToDelete(student)} color="text-red-500" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

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

            {isStudentModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-gray-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <GraduationCap size={20} className="text-red-500"/>
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
                                        className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-gray-900 bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido Paterno</label>
                                    <input
                                        value={studentFormData.Apellido_Paterno_Discente}
                                        onChange={(e) => setStudentFormData({...studentFormData, Apellido_Paterno_Discente: e.target.value})}
                                        className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-gray-900 bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido Materno</label>
                                    <input
                                        value={studentFormData.Apellido_Materno_Discente}
                                        onChange={(e) => setStudentFormData({...studentFormData, Apellido_Materno_Discente: e.target.value})}
                                        className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-gray-900 bg-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition shadow-md">
                                    {editingStudent ? "Guardar Cambios" : "Crear Alumno"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {studentToDelete && (
                <ConfirmDeleteModal
                    title="Eliminar Alumno"
                    isDeleting={isDeletingStudent}
                    onConfirm={confirmDeleteStudent}
                    onCancel={() => setStudentToDelete(null)}
                    message={
                        <>
                            ¿Estás seguro de que deseas eliminar a{" "}
                            <span className="font-semibold">
                                {studentToDelete.Nombre_Discente} {studentToDelete.Apellido_Paterno_Discente}
                            </span>{" "}
                            del sistema? Se perderá su historial de intentos. Esta acción no se puede deshacer.
                        </>
                    }
                />
            )}
        </div>
    );
}