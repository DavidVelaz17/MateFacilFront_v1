"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
// Importa tu componente PhaserGame (ajusta la ruta según tu proyecto)
import dynamic from 'next/dynamic';

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
    ssr: false,
    loading: () => <div className="text-white flex items-center justify-center h-full">Cargando motor de juego...</div>
});
export default function PlayPage() {
    const searchParams = useSearchParams();

    // 1. DECLARAMOS EL ESTADO PARA GUARDAR LOS DATOS (Inicia en null)
    const [levelData, setLevelData] = useState<any>(null);

    useEffect(() => {
        const mode = searchParams.get('mode');
        const configString = searchParams.get('config');

        // Objeto base que enviaremos a Phaser
        const initialPhaserData = {
            mode: mode, // 'historia' o 'custom'
            config: null as any // Solo se llena si es custom
        };

        if (mode === 'custom' && configString) {
            initialPhaserData.config = JSON.parse(decodeURIComponent(configString));
        }

        // 2. GUARDAMOS EL OBJETO EN EL ESTADO
        setLevelData(initialPhaserData);

    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">

            {/* Header o botón para regresar al Dashboard */}
            <div className="w-full max-w-[800px] flex justify-between items-center mb-4 text-white">
                <h1 className="text-xl font-bold">MateFacil - Zona de Juego</h1>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                >
                    Volver al Panel
                </button>
            </div>

            <div className="relative w-[800px] h-[600px] bg-black border-4 border-gray-600 rounded-lg shadow-2xl overflow-hidden">
                {/* 3. RENDERIZADO CONDICIONAL */}
                {/* Solo renderizamos el juego cuando levelData ya no es null */}
                {levelData && <PhaserGame levelData={levelData} />}
            </div>

        </div>
    );
}