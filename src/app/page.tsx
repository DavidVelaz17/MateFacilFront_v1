"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Lógica simple de ruteo para el prototipo
        if (username.toLowerCase() === "admin") {
            router.push("/admin"); // Redirige al panel de Administrador
        } else {
            router.push("/dashboard"); // Redirige al panel de Profesor
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form onSubmit={handleLogin} className="w-96 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h1 className="text-2xl font-bold mb-2 text-center text-blue-600">MateFácil</h1>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Usuario</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white shadow-sm"
                        placeholder="ej. profesor1"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                    <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white shadow-sm"
                        placeholder="*****"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition shadow-md">
                    Ingresar
                </button>
            </form>
        </div>
    );
}