"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, Check, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast Container - positioned above bottom nav on mobile */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300",
                            t.type === "success" ? "bg-stadium-dark/90 border-accent-green/30 text-accent-green" :
                                t.type === "error" ? "bg-stadium-dark/90 border-red-500/30 text-red-500" :
                                    "bg-stadium-dark/90 border-white/10 text-white"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5",
                            t.type === "success" && "bg-accent-green/10",
                            t.type === "error" && "bg-red-500/10"
                        )}>
                            {t.type === "success" && <Check size={16} />}
                            {t.type === "error" && <AlertTriangle size={16} />}
                            {t.type === "info" && <Info size={16} />}
                        </div>

                        <span className="text-sm font-bold flex-1">{t.message}</span>

                        <button
                            onClick={() => removeToast(t.id)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context.toast; // Direct access to toast function
};
