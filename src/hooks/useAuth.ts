"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import api from "@/config/api";

interface CustomJwtPayload {
    sub: number;
    username: string;
    name: string;
    role: string;
}

interface UseAuthResult {
    docenteId: number | null;
    docenteName: string;
    role: string | null;
    logout: () => void;
}

// Centraliza la logica de "leer token, validar, decodificar JWT, redirigir
// si falta" que antes estaba duplicada casi igual en admin/page.tsx y
// dashboard/page.tsx.
export function useAuth(): UseAuthResult {
    const router = useRouter();
    const [docenteId, setDocenteId] = useState<number | null>(null);
    const [docenteName, setDocenteName] = useState<string>("Cargando...");
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token || token === "undefined" || token === "null") {
            localStorage.removeItem("token");
            router.push("/");
            return;
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
            const decoded = jwtDecode<CustomJwtPayload>(token);
            if (!decoded.sub) {
                throw new Error("El token no contiene el ID del usuario (sub)");
            }
            setDocenteId(decoded.sub);
            setDocenteName(decoded.name);
            setRole(decoded.role);
        } catch (error) {
            console.error("Sesion invalida o token corrupto:", error);
            localStorage.removeItem("token");
            delete api.defaults.headers.common["Authorization"];
            router.push("/");
        }
    }, [router]);

    const logout = () => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        router.push("/");
    };

    return { docenteId, docenteName, role, logout };
}
