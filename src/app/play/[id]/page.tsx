"use client";
import { useEffect, useState } from 'react';
import {useParams, useSearchParams} from 'next/navigation';
import dynamic from 'next/dynamic';
import {EventBus} from "@/game/scenes/patterns";
import api from "@/config/api";
import { useToast } from "@/components/ToastProvider";

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
    ssr: false,
    loading: () => <div className="text-white flex items-center justify-center h-full">Cargando motor de juego...</div>
});

export default function PlayPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const { showToast } = useToast();
    const [levelData, setLevelData] = useState<any>(null);

    // 1. EFECTO ORIGINAL: Carga la configuración del nivel
    useEffect(() => {
        const fetchInitialData = async () => {
            const mode = searchParams.get('mode');
            const configString = searchParams.get('config');
            const initialPhaserData = {
                mode: mode,
                config: null as any,
                totalStars: 0,
                dificultad: 2,
                nivelMapaTierra: 0,
                nivelMapaAgua: 0
            };

            if (mode === 'custom' && configString) {
                initialPhaserData.config = JSON.parse(decodeURIComponent(configString));
            }
            try {
                const token = localStorage.getItem('token');
                if (token && params.id) {
                    const statsRes = await api.get(`/discentes/${params.id}/stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    initialPhaserData.totalStars = statsRes.data.totalStars || 0;
                    console.log("Estrellas históricas cargadas:", initialPhaserData.totalStars);

                    // Retomamos la dificultad del ultimo intento en modo
                    // historia (1-3), ignorando intentos en modo custom
                    // (Dificultad=4, no aplica aqui), para no reiniciar
                    // siempre en Normal cuando el alumno vuelve a jugar.
                    const recentSessions: { Dificultad: number }[] = statsRes.data.recentSessions || [];
                    const lastStorySession = recentSessions.find(
                        (session) => session.Dificultad >= 1 && session.Dificultad <= 3
                    );
                    if (lastStorySession) {
                        initialPhaserData.dificultad = lastStorySession.Dificultad;
                        console.log("Dificultad retomada del último intento:", initialPhaserData.dificultad);
                    }

                    // Retomamos en qué nivel del mapa se quedó en cada mundo.
                    initialPhaserData.nivelMapaTierra = statsRes.data.nivelMapaTierra || 0;
                    initialPhaserData.nivelMapaAgua = statsRes.data.nivelMapaAgua || 0;
                }
            } catch (error) {
                console.error("No se pudo cargar el historial de estrellas:", error);
                showToast("No se pudo cargar el historial de estrellas del alumno.", "info");
            }
            setLevelData(initialPhaserData);
        };
        fetchInitialData();
    }, [searchParams, params.id]);

    useEffect(() => {
        const handleGameOverStats = async (stats: any) => {
            const idDiscente = params.id;
            const token = localStorage.getItem('token');

            // Validaciones de seguridad
            if (!idDiscente) {
                console.error("Error: No se encontró el ID del alumno en la URL.");
                return;
            }
            if (!token) {
                console.error("Error: No hay sesión activa (Falta Token).");
                return;
            }

            try {
                console.log("Atrapando estadísticas desde Phaser:", stats);

                // Envío de las estadísticas procesadas al backend
                const response = await api.post(
                    `/discentes/${idDiscente}/attempts`,
                    stats,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                console.log("¡Estadísticas guardadas exitosamente en la base de datos!");

                // El aviso de racha/logro ahora lo dibuja NotificationScene
                // (dentro de Phaser, ver game/scenes/NotificationScene.tsx):
                // así sobrevive a los cambios de escena y se limpia junto
                // con ellos, en vez de flotar sobre React encima del canvas.
                const { logrosNuevos, rachaDias, rachaVictorias } = response.data;
                if (logrosNuevos && logrosNuevos.length > 0) {
                    EventBus.emit('logrosUnlocked', logrosNuevos);
                }
                EventBus.emit('streakUpdate', { dias: rachaDias, victorias: rachaVictorias });
            } catch (error) {
                console.error("Fallo al guardar las estadísticas en el backend:", error);
                showToast("No se pudo guardar el resultado de esta partida.", "error");
            }
        };

        // Encendemos el "micrófono" para escuchar a Phaser
        EventBus.on('gameOverStats', handleGameOverStats);

        // FUNCIÓN DE LIMPIEZA: Apagamos el "micrófono" si el docente sale de la página
        // Esto evita que se envíen intentos duplicados a la base de datos
        return () => {
            EventBus.off('gameOverStats', handleGameOverStats);
        };
    }, [params.id]);

    // Guarda en qué nivel del mapa quedó el alumno (MapScene.tsx -> evento
    // 'mapProgress'), para que la próxima sesión retome ahí en vez de
    // reiniciar siempre en el primer nivel del mundo.
    useEffect(() => {
        const handleMapProgress = async ({ element, nivel }: { element: 'tierra' | 'agua'; nivel: number }) => {
            const idDiscente = params.id;
            const token = localStorage.getItem('token');
            if (!idDiscente || !token) return;

            try {
                const payload = element === 'tierra'
                    ? { NivelMapaTierra: nivel }
                    : { NivelMapaAgua: nivel };
                const response = await api.patch(`/discentes/${idDiscente}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // "Mundo Terrestre"/"Mundo Acuático" dependen de este nivel,
                // no de la partida que se acaba de guardar (ver
                // StudentsService.update en el backend), así que se
                // desbloquean aquí, justo al completar el mundo.
                const { logrosNuevos } = response.data;
                if (logrosNuevos && logrosNuevos.length > 0) {
                    EventBus.emit('logrosUnlocked', logrosNuevos);
                }
            } catch (error) {
                console.error("No se pudo guardar el avance del mapa:", error);
            }
        };

        EventBus.on('mapProgress', handleMapProgress);
        return () => {
            EventBus.off('mapProgress', handleMapProgress);
        };
    }, [params.id]);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[800px] flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-4 text-white">
                <h1 className="text-lg sm:text-xl font-bold">MateFácil - Zona de Juego</h1>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition self-start sm:self-auto"
                >
                    Volver al Panel
                </button>
            </div>
            <div className="relative w-full max-w-4xl aspect-[4/3] bg-black border-4 border-gray-600 rounded-lg shadow-2xl overflow-hidden">
                {levelData && <PhaserGame levelData={levelData} />}
            </div>
        </div>
    );
}