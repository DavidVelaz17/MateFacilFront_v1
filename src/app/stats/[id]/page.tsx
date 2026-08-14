"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/config/api";
import { useToast } from "@/components/ToastProvider";

import { ArrowLeft, Clock, RotateCcw, Smile, Activity, BarChart, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2, ListChecks, X, Check, Heart, Star, TrendingUp, Flame, Target, Lock, Printer } from "lucide-react";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

interface DesgloseEvento {
    orden: number;
    valor: number;
    tipo: 'objetivo' | 'trampa';
    correcta: boolean;
    tiempo: number;
}

// Un sub-intento fallido se crea por cada vida perdida; el ultimo puede
// terminar exitoso o no.
interface DesgloseIntento {
    numero: number;
    exitoso: boolean;
    vidasRestantes: number;
    eventos: DesgloseEvento[];
}

interface Desglose {
    objetivo: number[];
    trampas: number[];
    resultado: number;
    // intentos: formato nuevo (multiples sub-intentos). eventos: formato viejo
    // (partidas registradas antes de este cambio, un solo arreglo plano).
    intentos?: DesgloseIntento[];
    eventos?: DesgloseEvento[];
}

interface Logro {
    codigo: string;
    nombre: string;
    descripcion: string;
    icono: string;
    desbloqueado: boolean;
    fecha: string | null;
    progreso: { actual: number; total: number } | null;
}

export default function StatsPage() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();

    const [stats, setStats] = useState({
        studentName: "",
        avgTime: "0s",
        attempts: 0,
        topEmotion: "Desconocido",
        difficulty: "Fácil",
        recentSessions: [] as any[],
        streaks: { dias: 0, victorias: 0 },
        logros: [] as Logro[]
    });

    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSession, setSelectedSession] = useState<any | null>(null);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showLogros, setShowLogros] = useState(true);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await api.get(`/discentes/${params.id}/stats`, {
                    params: { tzOffset: new Date().getTimezoneOffset() },
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data;

                const minutes = Math.floor(data.avgTime / 60);
                const seconds = data.avgTime % 60;
                const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

                const emocionesMap: Record<number, string> = { 1: "Frustrado", 2: "Feliz", 3: "Muy Feliz" };
                const dificultadMap: Record<number, string> = { 1: "Fácil", 2: "Media", 3: "Difícil",4: "Custom" };
                const operacionMap: Record<string, string> = {
                    suma: "Suma",
                    resta: "Resta",
                    multiplicacion: "Multiplicación",
                    division: "División"
                };

                setStats({
                    studentName: data.studentName || "",
                    avgTime: timeString,
                    attempts: data.attempts,
                    topEmotion: emocionesMap[data.topEmotion] || "Feliz",
                    difficulty: dificultadMap[data.difficulty] || "Fácil",
                    streaks: data.streaks || { dias: 0, victorias: 0 },
                    logros: (data.logros || []) as Logro[],
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
                            id: session.id,
                            date: formattedDate,
                            fechaRaw: dateObj,
                            score: session.score,
                            dificultadNum: sessionDifficultyNum,
                            emotion: emocionesMap[session.emotion] || "Feliz",
                            difficulty: dificultadMap[sessionDifficultyNum] || "Normal",
                            operation: operacionMap[session.operacion] || "Sin registrar",
                            operationKey: session.operacion as string,
                            desglose: (session.desglose || null) as Desglose | null,
                            vidas: session.vidas as number | null,
                            estrellas: session.estrellas as number
                        };
                    })
                });
            } catch (error) {
                console.error("Error al cargar estadisticas", error);
                showToast("No se pudieron cargar las estadísticas del alumno.", "error");
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
    const getAvatarSrc = (emotion: string): string => {
        switch (emotion) {
            case "Feliz":
                return "/assets/avatar_feliz.png";
            case "Muy Feliz":
                return "/assets/avatar_muyfeliz.png";
            case "Frustrado":
                return "/assets/avatar_triste.png";
            case "Enojo":
                return "assets/avatar_muytriste.png";
            default:
                return "/assets/avatar_normal.png";
        }
    };
    const getDifficultyBadge = (level: string) => {
        const colorMap: Record<string, string> = {
            "Difícil": "bg-red-500",
            "Media": "bg-yellow-500",
            "Fácil": "bg-green-500",
            "Custom": "bg-purple-600",
        };

        const styles = colorMap[level] || "bg-gray-500";

        return (
            <span className={`${styles} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}>
            {level}
        </span>
        );
    };
    const getOperationBadge = (operation: string) => {
        const colorMap: Record<string, string> = {
            "Suma": "bg-blue-100 text-blue-700",
            "Resta": "bg-orange-100 text-orange-700",
            "Multiplicación": "bg-purple-100 text-purple-700",
            "División": "bg-pink-100 text-pink-700",
        };

        const styles = colorMap[operation] || "bg-gray-100 text-gray-500";

        return (
            <span className={`${styles} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}>
                {operation}
            </span>
        );
    };

    const getOperationSymbol = (operationKey: string) => {
        const symbolMap: Record<string, string> = {
            suma: "+",
            resta: "-",
            multiplicacion: "x",
            division: "÷"
        };
        return symbolMap[operationKey] || "+";
    };

    const renderEventosTable = (eventos: DesgloseEvento[]) => (
        <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
                <th className="px-3 py-2">Orden</th>
                <th className="px-3 py-2">Número</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2">Tiempo</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {eventos.map((evento) => (
                <tr key={evento.orden}>
                    <td className="px-3 py-2 font-medium">{evento.orden}</td>
                    <td className="px-3 py-2 font-mono">{evento.valor}</td>
                    <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${evento.tipo === 'trampa' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {evento.tipo}
                        </span>
                    </td>
                    <td className="px-3 py-2">
                        {evento.correcta ? (
                            <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                <Check size={14} /> Correcto
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                <X size={14} /> Incorrecto
                            </span>
                        )}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{evento.tiempo}s</td>
                </tr>
            ))}
            {eventos.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                        El alumno no recogió ningún número en este intento.
                    </td>
                </tr>
            )}
            </tbody>
        </table>
    );

    // Se incluye la hora (a diferencia de la grafica del grupo, que agrupa por
    // dia) para que dos intentos del mismo dia no compartan etiqueta en el eje X.
    const progressChartData = [...stats.recentSessions]
        .sort((a, b) => a.fechaRaw.getTime() - b.fechaRaw.getTime())
        .map((session) => ({
            fecha: session.fechaRaw.toLocaleString('es-MX', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
            }),
            puntos: session.score,
            dificultad: session.dificultadNum
        }));

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
                <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reporte de Desempeño</h1>
                        <p className="text-gray-500">
                            Alumno: <span className="text-gray-700 font-bold">{stats.studentName || `#${params.id}`}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push(`/reporte/alumno/${params.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium transition-colors"
                        >
                            <Printer size={18} /> Imprimir reporte
                        </button>
                        <button
                            onClick={() => setShowProgressModal(true)}
                            disabled={stats.recentSessions.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                        >
                            <TrendingUp size={18} /> Ver avance
                        </button>
                    </div>
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
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100 bg-slate-50 flex items-center justify-center shrink-0 shadow-inner">
                            <img
                                src={getAvatarSrc(stats.topEmotion)}
                                alt={`Avatar ${stats.topEmotion}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {!isLoading && stats.recentSessions.length > 0 && (
                    <div className="mb-10">
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 flex-1 min-w-[200px]">
                                <div className="p-3 bg-orange-50 rounded-lg text-orange-500 shrink-0">
                                    <Flame size={22} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats.streaks.dias} {stats.streaks.dias === 1 ? 'día' : 'días'}</h3>
                                    <p className="text-gray-500 text-xs">jugando seguido</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 flex-1 min-w-[200px]">
                                <div className="p-3 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                                    <Target size={22} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats.streaks.victorias} {stats.streaks.victorias === 1 ? 'partida' : 'partidas'}</h3>
                                    <p className="text-gray-500 text-xs">ganadas seguidas</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                            <button
                                onClick={() => setShowLogros((prev) => !prev)}
                                className="w-full flex items-center justify-between gap-2 text-left"
                            >
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    🏅 Logros — {stats.logros.filter(l => l.desbloqueado).length} de {stats.logros.length} desbloqueados
                                </h3>
                                {showLogros ? (
                                    <ChevronUp size={18} className="text-gray-400 shrink-0" />
                                ) : (
                                    <ChevronDown size={18} className="text-gray-400 shrink-0" />
                                )}
                            </button>
                            {showLogros && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                                    {stats.logros.map((logro) => (
                                        <div
                                            key={logro.codigo}
                                            className={`rounded-lg p-3 text-center border flex flex-col items-center gap-1.5 ${
                                                logro.desbloqueado ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200"
                                            }`}
                                        >
                                            <span className={`text-2xl leading-none ${logro.desbloqueado ? "" : "grayscale opacity-40"}`}>
                                                {logro.icono}
                                            </span>
                                            <span className={`text-xs font-bold ${logro.desbloqueado ? "text-gray-800" : "text-gray-400"}`}>
                                                {logro.nombre}
                                            </span>
                                            <span className="text-[10.5px] text-gray-500 leading-tight min-h-[26px]">
                                                {logro.descripcion}
                                            </span>
                                            {logro.desbloqueado ? (
                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                                                    {new Date(logro.fecha as string).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                </span>
                                            ) : logro.progreso ? (
                                                <div className="w-full">
                                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-300 rounded-full"
                                                            style={{ width: `${Math.min(100, (logro.progreso.actual / logro.progreso.total) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-gray-400">{logro.progreso.actual} / {logro.progreso.total}</span>
                                                </div>
                                            ) : (
                                                <Lock size={12} className="text-gray-300" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <Activity size={18}/> Historial de Sesiones
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-10 flex justify-center text-gray-400">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                        ) : (
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-600 uppercase">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Fecha</th>
                                <th className="px-6 py-3 whitespace-nowrap">Operación</th>
                                <th className="px-6 py-3 whitespace-nowrap">Dificultad</th>
                                <th className="px-6 py-3 whitespace-nowrap">Puntaje</th>
                                <th className="px-6 py-3 whitespace-nowrap">Estrellas</th>
                                <th className="px-6 py-3 whitespace-nowrap">Emoción Final</th>
                                <th className="px-6 py-3 whitespace-nowrap text-center">Detalle</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-gray-700">
                            {currentSessions.map((session, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3">{session.date}</td>
                                    <td className="px-6 py-3">
                                        {getOperationBadge(session.operation)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {getDifficultyBadge(session.difficulty)}
                                    </td>
                                    <td className="px-6 py-3 font-medium">{session.score} / 100</td>
                                    <td className="px-6 py-3">
                                        <span className="inline-flex items-center gap-1 text-yellow-500 font-semibold">
                                            <Star size={14} className="fill-current" /> {session.estrellas}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getEmotionColor(session.emotion)}`}>
                                            {session.emotion}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <button
                                            onClick={() => setSelectedSession(session)}
                                            title="Ver desglose de la partida"
                                            className="inline-flex items-center justify-center p-2 rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
                                        >
                                            <ListChecks size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        )}

                        {!isLoading && stats.recentSessions.length === 0 && (
                            <div className="p-6 text-center text-gray-500">
                                No hay sesiones registradas aún.
                            </div>
                        )}
                    </div>

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

            {selectedSession && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedSession(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <ListChecks size={18} /> Desglose de la partida
                            </h3>
                            <button
                                onClick={() => setSelectedSession(null)}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {getOperationBadge(selectedSession.operation)}
                                {getDifficultyBadge(selectedSession.difficulty)}
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600">
                                    {selectedSession.date}
                                </span>
                                {(selectedSession.vidas !== null && selectedSession.vidas !== undefined) && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-50 text-red-600">
                                        <Heart size={12} className="fill-current" /> {selectedSession.vidas} {selectedSession.vidas === 1 ? 'vida' : 'vidas'}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-yellow-50 text-yellow-600">
                                    <Star size={12} className="fill-current" /> {selectedSession.estrellas} {selectedSession.estrellas === 1 ? 'estrella' : 'estrellas'}
                                </span>
                            </div>

                            {!selectedSession.desglose ? (
                                <p className="text-gray-500 text-sm">
                                    Esta partida no tiene desglose disponible (fue registrada antes de esta función).
                                </p>
                            ) : (
                                <>
                                    <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                        <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Ecuación objetivo</p>
                                        <p className="text-lg font-mono font-bold text-gray-800">
                                            {selectedSession.desglose.objetivo.join(` ${getOperationSymbol(selectedSession.operationKey)} `)}
                                            {' = '}
                                            {selectedSession.desglose.resultado}
                                        </p>
                                    </div>

                                    {selectedSession.desglose.intentos ? (
                                        <div className="space-y-5">
                                            {selectedSession.desglose.intentos.map((intento: DesgloseIntento) => (
                                                <div key={intento.numero}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-bold text-gray-700">
                                                            Intento {intento.numero}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                                <Heart size={12} className="fill-current text-red-400" /> {intento.vidasRestantes}
                                                            </span>
                                                            {intento.exitoso ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-green-100 text-green-700">
                                                                    <Check size={12} /> Exitoso
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-red-100 text-red-700">
                                                                    <X size={12} /> Fallido
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {renderEventosTable(intento.eventos)}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        renderEventosTable(selectedSession.desglose.eventos || [])
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showProgressModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setShowProgressModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp size={18} /> Avance del alumno
                            </h3>
                            <button
                                onClick={() => setShowProgressModal(false)}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4">
                                Puntaje (0-100) y dificultad (1-3, 4=personalizado) por partida, en orden cronológico.
                            </p>
                            <div className="w-full h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={progressChartData} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} interval="preserveStartEnd" />
                                        <YAxis yAxisId="puntos" domain={[0, 100]} tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="dificultad" orientation="right" domain={[0, 4]} allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line yAxisId="puntos" type="monotone" dataKey="puntos" name="Puntaje" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line yAxisId="dificultad" type="monotone" dataKey="dificultad" name="Dificultad" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}