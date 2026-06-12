"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
// Agregamos ChevronLeft y ChevronRight para los botones de paginación
import { ArrowLeft, Clock, RotateCcw, Smile, Activity, BarChart, ChevronLeft, ChevronRight } from "lucide-react";

export default function StatsPage() {
    const router = useRouter();
    const params = useParams();

    const [stats, setStats] = useState({
        avgTime: "0s",
        attempts: 0,
        topEmotion: "Desconocido",
        difficulty: "Fácil",
        recentSessions: [] as any[]
    });

    const [isLoading, setIsLoading] = useState(true);

    // --- NUEVOS ESTADOS PARA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`http://localhost:3001/discentes/${params.id}/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data;

                const minutes = Math.floor(data.avgTime / 60);
                const seconds = data.avgTime % 60;
                const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

                const emocionesMap: Record<number, string> = { 1: "Frustrado", 2: "Feliz", 3: "Muy Feliz" };
                const dificultadMap: Record<number, string> = { 1: "Fácil", 2: "Media", 3: "Difícil" };

                setStats({
                    avgTime: timeString,
                    attempts: data.attempts,
                    topEmotion: emocionesMap[data.topEmotion] || "Feliz",
                    difficulty: dificultadMap[data.difficulty] || "Fácil",
                    // Asumimos que data.recentSessions ahora trae TODOS los registros desde el backend
                    recentSessions: data.recentSessions.map((session: any) => {
                        const dateObj = new Date(session.fecha);
                        const formattedDate = dateObj.toLocaleString('es-MX', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        });
                        const sessionDifficultyNum = session.Dificultad || session.dificultad || 2;
                        return {
                            date: formattedDate,
                            score: session.score,
                            emotion: emocionesMap[session.emotion] || "Feliz",
                            difficulty: dificultadMap[sessionDifficultyNum] || "Normal"
                        };
                    })
                });
            } catch (error) {
                console.error("Error al cargar estadisticas", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [params.id]);

    const getEmotionColor = (emotion: string) => {
        switch (emotion) {
            case "Feliz": case "Muy Feliz": return "text-green-600 bg-green-100";
            case "Frustrado": case "Enojo": return "text-red-600 bg-red-100";
            case "Concentrado": return "text-blue-600 bg-blue-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    const getDifficultyBadge = (level: string) => {
        const styles = level === "Difícil" ? "bg-red-500" : level === "Media" ? "bg-yellow-500" : "bg-green-500";
        return <span className={`${styles} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}>{level}</span>;
    };

    // --- LÓGICA DE PAGINACIÓN ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSessions = stats.recentSessions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(stats.recentSessions.length / itemsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-black">
            <button onClick={() => router.back()} className="flex items-center gap-2 mb-8 text-blue-600 hover:text-blue-800 transition-colors font-medium">
                <ArrowLeft size={20}/> Volver al listado
            </button>

            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Reporte de Desempeño</h1>
                    <p className="text-gray-500">Alumno ID: <span className="font-mono text-gray-700 font-bold">#{params.id}</span></p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between h-full">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Tiempo Promedio</p>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.avgTime}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                            <Clock size={24} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between h-full">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Intentos</p>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.attempts}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                            <RotateCcw size={24} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between h-full">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Dificultad Promedio</p>
                            <div className="mt-2">{getDifficultyBadge(stats.difficulty)}</div>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600 shrink-0">
                            <BarChart size={24} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between h-full">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Emoción Predominante</p>
                            <h3 className={`text-xl md:text-2xl font-bold inline-block px-2 py-1 rounded ${getEmotionColor(stats.topEmotion)}`}>
                                {stats.topEmotion}
                            </h3>
                        </div>
                        <div className="p-3 bg-pink-50 rounded-lg text-pink-500 shrink-0">
                            <Smile size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <Activity size={18}/> Historial de Sesiones
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-600 uppercase">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Fecha</th>
                                <th className="px-6 py-3 whitespace-nowrap">Dificultad</th>
                                <th className="px-6 py-3 whitespace-nowrap">Puntaje</th>
                                <th className="px-6 py-3 whitespace-nowrap">Emoción Final</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-gray-700">
                            {/* Iteramos sobre currentSessions en lugar de todo el arreglo */}
                            {currentSessions.map((session, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3">{session.date}</td>
                                    <td className="px-6 py-3">
                                        {getDifficultyBadge(session.difficulty)}
                                    </td>
                                    <td className="px-6 py-3 font-medium">{session.score} / 100</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getEmotionColor(session.emotion)}`}>
                                            {session.emotion}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Mensaje de estado de carga o sin datos (Opcional) */}
                        {!isLoading && stats.recentSessions.length === 0 && (
                            <div className="p-6 text-center text-gray-500">
                                No hay sesiones registradas aún.
                            </div>
                        )}
                    </div>

                    {/* CONTROLES DE PAGINACIÓN */}
                    {stats.recentSessions.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, stats.recentSessions.length)}</span> de <span className="font-medium">{stats.recentSessions.length}</span> registros
                            </span>

                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-md border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-md border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}