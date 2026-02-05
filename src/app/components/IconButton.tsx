import { ReactNode } from "react";

interface IconButtonProps {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
}

export default function IconButton({ icon, label, onClick, color = "text-gray-600" }: IconButtonProps) {
    return (
        <div className="group relative flex items-center justify-center">
            <button
                onClick={onClick}
                className={`${color} hover:scale-110 transition-transform p-2`}
            >
                {icon}
            </button>
            {/* Tooltip */}
            <span className="absolute bottom-full mb-2 hidden group-hover:block w-auto p-2 min-w-max rounded-md bg-gray-800 text-xs text-white font-bold transition-opacity duration-300 shadow-lg z-10">
        {label}
      </span>
        </div>
    );
}