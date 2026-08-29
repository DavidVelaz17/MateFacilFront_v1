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

                    // Retoma la dificultad del ultimo intento en modo historia (1-3);
                    // ignora custom (Dificultad=4) para no reiniciar siempre en Normal.
                    const recentSessions: { Dificultad: number }[] = statsRes.data.recentSessions || [];
                    const lastStorySession = recentSessions.find(
                        (session) => session.Dificultad >= 1 && session.Dificultad <= 3
                    );
                    if (lastStorySession) {
                        initialPhaserData.dificultad = lastStorySession.Dificultad;
                        console.log("Dificultad retomada del último intento:", initialPhaserData.dificultad);
                    }

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

            if (!idDiscente) {
                console.error("Error: No se encontró el ID del alumno en la URL.");
                return;
            }
            if (!token) {
                console.error("Error: No hay sesión activa (Falta Token).");
                return;
            }

            let response;
            try {
                console.log("Atrapando estadísticas desde Phaser:", stats);

                // TzOffset: el backend agrupa la racha de dias por el dia
                // calendario local del alumno, no por UTC.
                response = await api.post(
                    `/discentes/${idDiscente}/attempts`,
                    { ...stats, TzOffset: new Date().getTimezoneOffset() },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                console.log("¡Estadísticas guardadas exitosamente en la base de datos!");
            } catch (error) {
                console.error("Fallo al guardar las estadísticas en el backend:", error);
                showToast("No se pudo guardar el resultado de esta partida.", "error");
                return;
            }

            // Fuera del try/catch de arriba a proposito: la partida ya se guardo,
            // asi que un error aqui (ej. NotificationScene ya destruida si el
            // jugador salio/reinicio mientras el POST seguia en vuelo) no debe
            // reportarse como fallo de guardado.
            try {
                // NotificationScene (dentro de Phaser) dibuja el aviso de racha/logro
                // para que sobreviva a cambios de escena, en vez de flotar sobre React.
                const { logrosNuevos, rachaDias, rachaVictorias } = response.data;
                if (logrosNuevos && logrosNuevos.length > 0) {
                    EventBus.emit('logrosUnlocked', logrosNuevos);
                }
                EventBus.emit('streakUpdate', { dias: rachaDias, victorias: rachaVictorias });
            } catch (error) {
                console.error("La partida se guardó, pero falló al mostrar el aviso de racha/logro:", error);
            }
        };

        EventBus.on('gameOverStats', handleGameOverStats);

        // Se desuscribe al desmontar para no enviar intentos duplicados al backend.
        return () => {
            EventBus.off('gameOverStats', handleGameOverStats);
        };
    }, [params.id]);

    // Escucha 'mapProgress' (MapScene.tsx) y lo guarda para que la proxima
    // sesion retome ahi en vez de reiniciar en el primer nivel del mundo.
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

                // Los logros de "Mundo Terrestre/Acuático" dependen de este nivel
                // (StudentsService.update en el backend), no de la partida guardada.
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition self-start sm:self-auto"
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