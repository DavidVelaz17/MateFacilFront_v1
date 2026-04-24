"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation"; // Agregamos useSearchParams
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react"; // Agregamos hooks de React

// IMPORTANTE: Cargamos el componente sin SSR
const PhaserGame = dynamic(() => import("@/components/PhaserGame"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-white text-xl animate-pulse">Cargando motor de juego...</p></div>
});

export default function PlayPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams(); // Hook para leer la URL

    // Estado para guardar la configuración si es que existe
    const [gameConfig, setGameConfig] = useState<any>(null);

    useEffect(() => {
        // Leemos la URL cuando la página carga
        const mode = searchParams.get('mode');
        const configString = searchParams.get('config');

        if (mode === 'custom' && configString) {
            try {
                // Decodificamos el texto de la URL y lo convertimos a un objeto
                const parsedConfig = JSON.parse(decodeURIComponent(configString));
                setGameConfig(parsedConfig);
            } catch (error) {
                console.error("Error al leer la configuración del nivel:", error);
            }
        }
    }, [searchParams]);

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="hover:bg-gray-700 p-2 rounded-full transition-colors">
                        <ArrowLeft />
                    </button>
                    <h2 className="font-bold text-lg">
                        Jugando: Alumno ID {params.id}
                        {searchParams.get('mode') === 'custom' ? ' (Modo Custom)' : ' (Modo Historia)'}
                    </h2>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 to-gray-900">
                {/* Contenedor donde Phaser buscará el ID "phaser-game" */}
                <div id="phaser-game" className="relative w-[800px] h-[600px] bg-black border-4 border-gray-600 rounded-lg shadow-2xl overflow-hidden">
                    {/* Le pasamos la configuración al componente del juego */}
                    <PhaserGame levelData={gameConfig} />
                </div>
            </div>
        </div>
    );
}