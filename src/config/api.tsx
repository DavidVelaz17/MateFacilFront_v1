import axios from "axios";

// NEXT_PUBLIC_API_URL (si esta definido) se incrusta en el bundle en build
// time y siempre gana: sirve para forzar un backend fijo (ej. produccion
// con dominio/HTTPS). Si no esta definido, resolvemos el backend en tiempo
// de ejecucion usando el mismo host con el que el navegador ya cargo el
// frontend (window.location.hostname). Asi funciona sin reconstruir sin
// importar la red/IP LAN desde la que se acceda.
const resolveBaseURL = (): string | undefined => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== "undefined") {
        return `http://${window.location.hostname}:3001`;
    }
    return undefined;
};

const api = axios.create({
    baseURL: resolveBaseURL(),
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Si el token expiro o es invalido, el backend responde 401 en cualquier
// endpoint protegido: limpiamos la sesion y regresamos al login en vez de
// dejar que cada pantalla falle en silencio.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined' && error?.response?.status === 401) {
            localStorage.removeItem("token");
            delete api.defaults.headers.common["Authorization"];
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;