"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

// IMPORTANTE: Cargamos el componente sin SSR
const PhaserGame = dynamic(() => import("@/components/PhaserGame"), {
    ssr: false,
    loading: () => <p className="text-white">Cargando motor de juego...</p>
});

export default function PlayPage() {
    const router = useRouter();
    const params = useParams();

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
            <div className="p-4 bg-gray-800 text-white flex items-center gap-4">
                <button onClick={() => router.back()} className="hover:bg-gray-700 p-2 rounded-full">
                    <ArrowLeft />
                </button>
                <h2 className="font-bold">Modo Juego - Alumno ID: {params.id}</h2>
            </div>

            <div className="flex-1 flex items-center justify-center bg-black">
                {/* Contenedor donde Phaser buscará el ID "phaser-game" */}
                <div id="phaser-game" className="relative w-[800px] h-[600px] bg-gray-700 border-4 border-gray-600">
                    <PhaserGame />
                </div>
            </div>
        </div>
    );
}