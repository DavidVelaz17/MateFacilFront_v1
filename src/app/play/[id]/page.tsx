"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
    ssr: false,
    loading: () => <div className="text-white flex items-center justify-center h-full">Cargando motor de juego...</div>
});
export default function PlayPage() {
    const searchParams = useSearchParams();
    const [levelData, setLevelData] = useState<any>(null);

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

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
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
                {levelData && <PhaserGame levelData={levelData} />}
            </div>

        </div>
    );
}
