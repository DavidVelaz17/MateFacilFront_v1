import axios from "axios";

// Sin NEXT_PUBLIC_API_URL, se resuelve el host en runtime via
// window.location.hostname para funcionar en cualquier IP de LAN sin rebuild.
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

// 401 en cualquier endpoint = token invalido/expirado: limpiamos sesion y
// redirigimos al login en vez de que cada pantalla falle en silencio.
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