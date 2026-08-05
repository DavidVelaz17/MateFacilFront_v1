"use client";
import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import Toast, { ToastType } from "./Toast";

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast debe usarse dentro de <ToastProvider>");
    }
    return ctx;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(1);

    const showToast = useCallback((message: string, type: ToastType = "error") => {
        const id = nextId.current++;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:w-full sm:max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast message={toast.message} type={toast.type} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
