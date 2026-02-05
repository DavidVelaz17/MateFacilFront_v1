"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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

            {/* Contenedor del Canvas */}
            <div className="flex-1 flex items-center justify-center bg-black">
                {/* Aquí Phaser inyectará el canvas */}
                <div id="phaser-game" className="w-[800px] h-[600px] bg-gray-700 flex items-center justify-center border-4 border-gray-600">
                    <span className="text-white text-opacity-50 font-mono">CANVAS DE PHASER AQUÍ</span>
                </div>
            </div>
        </div>
    );
}