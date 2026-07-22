import { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDeleteModalProps {
    title: string;
    message: ReactNode;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    extraContent?: ReactNode;
}

export default function ConfirmDeleteModal({
    title,
    message,
    isDeleting,
    onConfirm,
    onCancel,
    extraContent
}: ConfirmDeleteModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-gray-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-500" />
                        {title}
                    </h2>
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 text-sm text-gray-700 leading-relaxed">
                    <p>{message}</p>
                    {extraContent}
                </div>

                <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-md disabled:opacity-50"
                    >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
