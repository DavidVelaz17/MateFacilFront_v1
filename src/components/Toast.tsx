export type ToastType = "success" | "error" | "info";

interface ToastProps {
    message: string;
    type: ToastType;
}

const STYLES: Record<ToastType, string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
};

export default function Toast({ message, type }: ToastProps) {
    return (
        <div className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium text-white ${STYLES[type]}`}>
            {message}
        </div>
    );
}
