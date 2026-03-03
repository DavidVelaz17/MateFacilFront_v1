"use client";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Clock,
    RotateCcw,
    Smile,
    Activity,
    BarChart,
    BrainCircuit
} from "lucide-react";

export default function StatsPage() {
    const router = useRouter();
    const params = useParams();

    // --- MOCK DATA (Datos simulados) ---
    const stats = {
        avgTime: "12m 30s",
        attempts: 3,
        topEmotion: "Feliz", // Relacionado con tu avatar emocional
        difficulty: "Media",
        recentSessions: [
            { date: "2024-01-10", score: 85, emotion: "Feliz" },
            { date: "2024-01-12", score: 92, emotion: "Muy Feliz" },
            { date: "2024-01-14", score: 78, emotion: "Triste" },
        ]
    };

    // Función auxiliar para color de emoción
    const getEmotionColor = (emotion: string) => {
        switch (emotion) {
            case "Feliz": case "Feliz": return "text-green-600 bg-green-100";
            case "Frustrado": case "Enojo": return "text-red-600 bg-red-100";
            case "Concentrado": return "text-blue-600 bg-blue-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    // Función para color de dificultad
    const getDifficultyBadge = (level: string) => {
        const styles = level === "Difícil" ? "bg-red-500" : level === "Media" ? "bg-yellow-500" : "bg-green-500";
        return <span className={`${styles} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}>{level}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-black">
            {/* Botón Volver */}
            <button onClick={() => router.back()} className="flex items-center gap-2 mb-8 text-blue-600 hover:text-blue-800 transition-colors font-medium">
                <ArrowLeft size={20}/> Volver al listado
            </button>

            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Reporte de Desempeño</h1>
                    <p className="text-gray-500">Alumno ID: <span className="font-mono text-gray-700 font-bold">#{params.id}</span></p>
                </header>

                {/* GRID DE ESTADÍSTICAS PRINCIPALES */}
                {/* Ajuste clave: md:grid-cols-2 (2x2) y lg:grid-cols-4 (1 fila de 4) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

                    {/* 1. Tiempo Promedio */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between h-full">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Tiempo Promedio</p>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.avgTime}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                            <Clock size={24} />
                        </div>
                    </div>

                    {/* 2. Intentos Totales */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between h-full">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Intentos</p>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.attempts}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                            <RotateCcw size={24} />
                        </div>
                    </div>

                    {/* 3. Dificultad Percibida */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between h-full">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Dificultad Promedio</p>
                            <div className="mt-2">{getDifficultyBadge(stats.difficulty)}</div>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600 shrink-0">
                            <BarChart size={24} />
                        </div>
                    </div>

                    {/* 4. Emoción Más Recurrente */}
                    {/* Se eliminaron los col-span manuales para que fluya de forma natural */}
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

                {/* TABLA DE SESIONES RECIENTES (Extra) */}
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
                                <th className="px-6 py-3 whitespace-nowrap">Puntaje</th>
                                <th className="px-6 py-3 whitespace-nowrap">Emoción Final</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-gray-700">
                            {stats.recentSessions.map((session, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3">{session.date}</td>
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
                    </div>
                </div>

            </div>
        </div>
    );
}