"use client";
import { useEffect, useState } from 'react';
import {useParams, useSearchParams} from 'next/navigation';
import dynamic from 'next/dynamic';
import {EventBus} from "@/game/scenes/patterns";
import axios from "axios";

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
    ssr: false,
    loading: () => <div className="text-white flex items-center justify-center h-full">Cargando motor de juego...</div>
});

export default function PlayPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const [levelData, setLevelData] = useState<any>(null);

    // 1. EFECTO ORIGINAL: Carga la configuración del nivel
    useEffect(() => {
        const mode = searchParams.get('mode');
        const configString = searchParams.get('config');

        const initialPhaserData = {
            mode: mode,
            config: null as any
        };

        if (mode === 'custom' && configString) {
            initialPhaserData.config = JSON.parse(decodeURIComponent(configString));
        }
        setLevelData(initialPhaserData);

    }, [searchParams]);

    // 2. NUEVO EFECTO: Escucha al EventBus de Phaser y envía a NestJS
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
                await axios.post(
                    `http://localhost:3001/discentes/${idDiscente}/attempts`,
                    stats,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                console.log("¡Estadísticas guardadas exitosamente en la base de datos!");
            } catch (error) {
                console.error("Fallo al guardar las estadísticas en el backend:", error);
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

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[800px] flex justify-between items-center mb-4 text-white">
                <h1 className="text-xl font-bold">MateFácil - Zona de Juego</h1>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                >
                    Volver al Panel
                </button>
            </div>
            <div className="relative w-[800px] h-[600px] bg-black border-4 border-gray-600 rounded-lg shadow-2xl overflow-hidden">
                {levelData && <PhaserGame levelData={levelData} />}
            </div>
        </div>
    );
}