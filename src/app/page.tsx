"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Interfaz para saber que trae el token
interface CustomJwtPayload {
    sub: number;
    username: string;
    name: string;
    role: string;
}

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    // Agregamos el estado para controlar la contrasena
    const [password, setPassword] = useState("");
    // Estados para manejar errores de UI y carga
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Peticion real a tu backend en NestJS
            const response = await axios.post("http://localhost:3001/auth/login", {
                usuario: username,
                password: password
            });

            // Extraemos el token devuelto
            const token = response.data?.access_token;

            if (token) {
                // Guardamos el token en el navegador
                localStorage.setItem("token", token);

                // Decodificamos para saber si es admin o docente
                const decoded = jwtDecode<CustomJwtPayload>(token);

                // Enrutamiento seguro basado en la base de datos
                if (decoded.role === "admin") {
                    router.push("/admin");
                } else {
                    router.push("/dashboard");
                }
            } else {
                setError("El servidor no respondio correctamente.");
            }
        } catch (err: any) {
            console.error("Error al iniciar sesion:", err);
            // Manejo de errores de credenciales (401) o de servidor caido
            if (err.response?.status === 401) {
                setError("Usuario o contraseña incorrectos");
            } else {
                setError("Error al conectar con el servidor local");
            }
            // Limpieza en caso de fallo
            localStorage.removeItem("token");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form onSubmit={handleLogin} className="w-96 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h1 className="text-2xl font-bold mb-2 text-center text-blue-600">MateFácil</h1>

                {/* Bloque para mostrar errores visuales si falla el login */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center border border-red-200">
                        {error}
                    </div>
                )}

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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white shadow-sm"
                        placeholder="*****"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                >
                    {isLoading ? "Ingresando..." : "Ingresar"}
                </button>
            </form>
        </div>
    );
}