"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/config/api";
import { useToast } from "@/components/ToastProvider";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { ArrowLeft, Printer, Loader2, Flame, Target } from "lucide-react";

type Rango = "hoy" | "semana" | "mes" | "personalizado";

const fmtCorto = (d: Date) => d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Componentes LOCALES, no toISOString (da UTC y desfasa el campo un dia).
function toDateInputValue(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// new Date("YYYY-MM-DD") interpreta medianoche UTC, no el dia local elegido.
function parseLocalDateInput(value: string, endOfDay: boolean): Date {
    const [y, m, d] = value.split('-').map(Number);
    return endOfDay
        ? new Date(y, m - 1, d, 23, 59, 59, 999)
        : new Date(y, m - 1, d, 0, 0, 0, 0);
}

// Usa limites de dia en hora LOCAL (no UTC): un intento nocturno podria
// colarse en el dia equivocado si se mezclara con limites UTC.
function getRangeDates(
    rango: Rango,
    customDesde: string,
    customHasta: string,
): { desdeISO: string; hastaISO: string; label: string } {
    if (rango === "personalizado") {
        const desdeStr = customDesde || toDateInputValue(new Date());
        const hastaStr = customHasta && customHasta >= desdeStr ? customHasta : desdeStr;
        const inicio = parseLocalDateInput(desdeStr, false);
        const fin = parseLocalDateInput(hastaStr, true);
        const label = hastaStr === desdeStr ? fmtCorto(inicio) : `${fmtCorto(inicio)} — ${fmtCorto(fin)}`;
        return { desdeISO: inicio.toISOString(), hastaISO: fin.toISOString(), label };
    }

    const ahora = new Date();
    const inicioHoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    const finHoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

    const inicioLocal = new Date(inicioHoyLocal);
    if (rango === "semana") inicioLocal.setDate(inicioHoyLocal.getDate() - 6);
    else if (rango === "mes") inicioLocal.setDate(inicioHoyLocal.getDate() - 29);

    const label = rango === "hoy" ? fmtCorto(inicioHoyLocal) : `${fmtCorto(inicioLocal)} — ${fmtCorto(finHoyLocal)}`;

    return { desdeISO: inicioLocal.toISOString(), hastaISO: finHoyLocal.toISOString(), label };
}

const RANGO_LABEL: Record<Rango, string> = {
    hoy: "Hoy",
    semana: "Últimos 7 días",
    mes: "Últimos 30 días",
    personalizado: "Personalizado",
};

const OPERACION_LABEL: Record<string, string> = {
    suma: "Suma",
    resta: "Resta",
    multiplicacion: "Multiplicación",
    division: "División",
};

const EMOCION_LABEL: Record<number, string> = {
    1: "Frustrado",
    2: "Feliz",
    3: "Muy Feliz",
};

interface ReportData {
    studentName: string;
    grupos: string[];
    resumenPeriodo: {
        avgTime: number;
        attempts: number;
        avgDifficulty: number;
        topEmotion: number | null;
        totalStars: number;
    };
    estadoActual: {
        streaks: { dias: number; victorias: number };
        nivelMapaTierra: number;
        nivelMapaAgua: number;
        logrosTotales: number;
        logrosCatalogoTotal: number;
    };
    logrosEnPeriodo: { codigo: string; nombre: string; descripcion: string; icono: string }[];
    desglosePorOperacion: { operacion: string; intentos: number; victorias: number; porcentaje: number }[];
    sesionesPeriodo: {
        id: number; fecha: string; operacion: string; Dificultad: number;
        score: number; estrellas: number; vidas: number | null; emotion: number;
    }[];
}

export default function ReporteAlumnoPage() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();

    const [rango, setRango] = useState<Rango>("hoy");
    const [customDesde, setCustomDesde] = useState<string>(() => toDateInputValue(new Date()));
    const [customHasta, setCustomHasta] = useState<string>(() => toDateInputValue(new Date()));
    const [data, setData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const { desdeISO, hastaISO } = getRangeDates(rango, customDesde, customHasta);
                const token = localStorage.getItem("token");
                const res = await api.get(`/discentes/${params.id}/report`, {
                    params: { desde: desdeISO, hasta: hastaISO, tzOffset: new Date().getTimezoneOffset() },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (error) {
                console.error("Error al cargar el reporte", error);
                showToast("No se pudo cargar el reporte del alumno.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, [rango, customDesde, customHasta, params.id]);

    const chartData = (data?.sesionesPeriodo || []).map((s) => ({
        fecha: new Date(s.fecha).toLocaleString('es-MX', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
        }),
        puntos: s.score,
        dificultad: s.Dificultad,
    }));

    const { label: rangoLabel } = getRangeDates(rango, customDesde, customHasta);

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-black print:p-0">
            <div className="print:hidden max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                    <ArrowLeft size={20} /> Volver
                </button>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {(["hoy", "semana", "mes", "personalizado"] as Rango[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRango(r)}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${
                                    rango === r ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                {RANGO_LABEL[r]}
                            </button>
                        ))}
                    </div>
                    {rango === "personalizado" && (
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                            <input
                                type="date"
                                value={customDesde}
                                max={customHasta}
                                onChange={(e) => setCustomDesde(e.target.value)}
                                className="text-sm text-gray-700 outline-none"
                            />
                            <span className="text-gray-400 text-sm">—</span>
                            <input
                                type="date"
                                value={customHasta}
                                min={customDesde}
                                max={toDateInputValue(new Date())}
                                onChange={(e) => setCustomHasta(e.target.value)}
                                className="text-sm text-gray-700 outline-none"
                            />
                        </div>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                        <Printer size={18} /> Imprimir
                    </button>
                </div>
            </div>

            {isLoading || !data ? (
                <div className="flex justify-center py-20 text-gray-400"><Loader2 size={28} className="animate-spin" /></div>
            ) : (
                <div className="max-w-4xl mx-auto bg-white print:shadow-none shadow-sm border border-gray-200 print:border-0 rounded-xl p-8 print:p-0">
                    <header className="mb-8 pb-6 border-b border-gray-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-purple-600 mb-1">MateFácil · Reporte de Desempeño</p>
                        <h1 className="text-2xl font-bold text-gray-900">{data.studentName}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {data.grupos.join(', ') || 'Sin grupo asignado'} · Periodo: {RANGO_LABEL[rango]} ({rangoLabel})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Generado el {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </header>

                    <section className="mb-8 break-inside-avoid">
                        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Resumen del periodo</h2>
                        {data.resumenPeriodo.attempts === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay partidas registradas en este periodo.</p>
                        ) : (
                            <div className="grid grid-cols-5 gap-4">
                                <div className="border border-gray-200 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-gray-800">{data.resumenPeriodo.attempts}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Intentos</p>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-gray-800">{data.resumenPeriodo.avgTime}s</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Tiempo prom.</p>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-gray-800">{data.resumenPeriodo.avgDifficulty}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Dificultad prom.</p>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-gray-800">{data.resumenPeriodo.topEmotion ? EMOCION_LABEL[data.resumenPeriodo.topEmotion] : '—'}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Emoción</p>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-gray-800">⭐ {data.resumenPeriodo.totalStars}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Estrellas</p>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="mb-8 break-inside-avoid">
                        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Estado actual</h2>
                        <div className="grid grid-cols-5 gap-4">
                            <div className="border border-gray-200 rounded-lg p-3 text-center">
                                <p className="text-xl font-bold text-gray-800 flex items-center justify-center gap-1"><Flame size={16} className="text-orange-500" /> {data.estadoActual.streaks.dias}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Racha días</p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-3 text-center">
                                <p className="text-xl font-bold text-gray-800 flex items-center justify-center gap-1"><Target size={16} className="text-purple-600" /> {data.estadoActual.streaks.victorias}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Racha victorias</p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-3 text-center">
                                <p className="text-xl font-bold text-gray-800">🌎 {data.estadoActual.nivelMapaTierra}/5</p>
                                <p className="text-[10px] text-gray-500 uppercase">Mundo Terrestre</p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-3 text-center">
                                <p className="text-xl font-bold text-gray-800">🌊 {data.estadoActual.nivelMapaAgua}/5</p>
                                <p className="text-[10px] text-gray-500 uppercase">Mundo Acuático</p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-3 text-center">
                                <p className="text-xl font-bold text-gray-800">🏅 {data.estadoActual.logrosTotales}/{data.estadoActual.logrosCatalogoTotal}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Logros</p>
                            </div>
                        </div>
                    </section>

                    {data.logrosEnPeriodo.length > 0 && (
                        <section className="mb-8 break-inside-avoid">
                            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Logros obtenidos en este periodo</h2>
                            <div className="flex flex-wrap gap-2">
                                {data.logrosEnPeriodo.map((l) => (
                                    <span key={l.codigo} className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-3 py-1.5 text-xs font-semibold text-purple-800">
                                        <span className="text-base">{l.icono}</span> {l.nombre}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {chartData.length > 0 && (
                        <section className="mb-8 break-inside-avoid">
                            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Avance en el periodo</h2>
                            <div className="w-full h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} interval="preserveStartEnd" />
                                        <YAxis yAxisId="puntos" domain={[0, 100]} tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="dificultad" orientation="right" domain={[0, 4]} allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line yAxisId="puntos" type="monotone" dataKey="puntos" name="Puntaje" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line yAxisId="dificultad" type="monotone" dataKey="dificultad" name="Dificultad" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    )}

                    {data.desglosePorOperacion.length > 0 && (
                        <section className="mb-8 break-inside-avoid">
                            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Desglose por operación</h2>
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Operación</th>
                                        <th className="px-3 py-2 text-left">Intentos</th>
                                        <th className="px-3 py-2 text-left">Victorias</th>
                                        <th className="px-3 py-2 text-left">% de éxito</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data.desglosePorOperacion.map((d) => (
                                        <tr key={d.operacion}>
                                            <td className="px-3 py-2 font-medium">{OPERACION_LABEL[d.operacion] || d.operacion}</td>
                                            <td className="px-3 py-2">{d.intentos}</td>
                                            <td className="px-3 py-2">{d.victorias}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500" style={{ width: `${d.porcentaje}%` }} />
                                                    </div>
                                                    <span className="text-xs text-gray-500">{d.porcentaje}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    <section className="break-inside-avoid">
                        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Partidas del periodo</h2>
                        {data.sesionesPeriodo.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay partidas registradas en este periodo.</p>
                        ) : (
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Fecha</th>
                                        <th className="px-3 py-2 text-left">Operación</th>
                                        <th className="px-3 py-2 text-left">Dificultad</th>
                                        <th className="px-3 py-2 text-left">Puntaje</th>
                                        <th className="px-3 py-2 text-left">Estrellas</th>
                                        <th className="px-3 py-2 text-left">Emoción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data.sesionesPeriodo.map((s) => (
                                        <tr key={s.id}>
                                            <td className="px-3 py-2">{new Date(s.fecha).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                            <td className="px-3 py-2">{OPERACION_LABEL[s.operacion] || s.operacion}</td>
                                            <td className="px-3 py-2">{s.Dificultad}</td>
                                            <td className="px-3 py-2">{s.score}</td>
                                            <td className="px-3 py-2">⭐ {s.estrellas}</td>
                                            <td className="px-3 py-2">{EMOCION_LABEL[s.emotion] || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
