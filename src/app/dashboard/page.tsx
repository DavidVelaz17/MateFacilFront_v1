"use client";
import { useState, useEffect } from "react";
import { Edit, Trash2, Play, BarChart2, Plus, X } from "lucide-react";
import IconButton from "../components/IconButton";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Student {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
}

export default function Dashboard() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({
        nombres: "",
        apellidoPaterno: "",
        apellidoMaterno: ""
    });

    useEffect(() => {
        fetchStudents();
    }, []);


    useEffect(() => {
        if (editingStudent) {
            setFormData({
                nombres: editingStudent.nombres,
                apellidoPaterno: editingStudent.apellidoPaterno,
                apellidoMaterno: editingStudent.apellidoMaterno
            });
        } else {
            setFormData({ nombres: "", apellidoPaterno: "", apellidoMaterno: "" });
        }
    }, [editingStudent, isModalOpen]);

    const fetchStudents = async () => {
        try {
            const res = await axios.get("http://localhost:3001/students");
            setStudents(res.data);
        } catch (error) {
            console.error("Error al cargar alumnos", error);
        }
    };

    const handleOpenAdd = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (student: Student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                // --- MODO EDICIÓN (PUT/PATCH) ---
                // Nota: Asegúrate de tener el método PATCH o PUT en tu Backend
                // await axios.patch(`http://localhost:3001/students/${editingStudent.id}`, formData);

                // *Simulación visual para el prototipo (ya que quizá no tienes el endpoint PUT aún)*
                const updatedStudents = students.map(s =>
                    s.id === editingStudent.id ? { ...s, ...formData } : s
                );
                setStudents(updatedStudents);

            } else {
                // --- MODO CREACIÓN (POST) ---
                const res = await axios.post("http://localhost:3001/students", formData);
                // Agregamos el nuevo a la lista visualmente
                setStudents([...students, res.data]);
                // O podrías llamar a fetchStudents() de nuevo
            }

            setIsModalOpen(false); // Cerrar modal
        } catch (error) {
            console.error("Error al guardar", error);
        }
    };

    const handleDelete = async (id: number) => {
        if(!confirm("¿Estás seguro de eliminar este alumno?")) return;

        // await axios.delete(`http://localhost:3001/students/${id}`);

        // Simulación visual
        setStudents(students.filter(s => s.id !== id));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-black relative">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Mis Alumnos</h1>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-lg"
                    >
                        <Plus size={20} /> Agregar Alumno
                    </button>
                </header>

                {/* --- TABLA DE ALUMNOS (Fondo) --- */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                    <table className="min-w-full leading-normal">
                        <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Nombre(s)</th>
                            <th className="py-3 px-6 text-left">Apellido Paterno</th>
                            <th className="py-3 px-6 text-left">Apellido Materno</th>
                            <th className="py-3 px-6 text-center">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                        {students.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-6">No hay alumnos registrados</td></tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                                    <td className="py-3 px-6 text-left font-medium">{student.nombres}</td>
                                    <td className="py-3 px-6 text-left">{student.apellidoPaterno}</td>
                                    <td className="py-3 px-6 text-left">{student.apellidoMaterno}</td>
                                    <td className="py-3 px-6 text-center">
                                        <div className="flex item-center justify-center gap-4">
                                            <IconButton icon={<Edit size={18} />} label="Modificar" onClick={() => handleOpenEdit(student)} color="text-blue-500" />
                                            <IconButton icon={<Trash2 size={18} />} label="Eliminar" onClick={() => handleDelete(student.id)} color="text-red-500" />
                                            <IconButton icon={<Play size={18} />} label="Jugar" onClick={() => router.push(`/play/${student.id}`)} color="text-purple-500" />
                                            <IconButton icon={<BarChart2 size={18} />} label="Estadísticas" onClick={() => router.push(`/stats/${student.id}`)} color="text-yellow-600" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- EL MODAL EMERGENTE --- */}
            {isModalOpen && (
                // 1. Overlay oscuro (z-50 asegura que esté encima de todo)
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                    {/* 2. Contenedor del Modal (Blanco) */}
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-96 transform transition-all scale-100 relative">

                        {/* Botón cerrar (X) */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {editingStudent ? "Editar Alumno" : "Nuevo Alumno"}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-1 text-gray-700">Nombre(s)</label>
                                <input
                                    value={formData.nombres}
                                    onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                                    placeholder="Ej. Juan Pablo"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-1 text-gray-700">Apellido Paterno</label>
                                <input
                                    value={formData.apellidoPaterno}
                                    onChange={(e) => setFormData({...formData, apellidoPaterno: e.target.value})}
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                                    placeholder="Ej. Pérez"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-1 text-gray-700">Apellido Materno</label>
                                <input
                                    value={formData.apellidoMaterno}
                                    onChange={(e) => setFormData({...formData, apellidoMaterno: e.target.value})}
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                                    placeholder="Ej. López"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition"
                                >
                                    {editingStudent ? "Guardar Cambios" : "Agregar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}