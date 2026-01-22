"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => string;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

// Toast Provider
interface ToastProviderProps {
    children: React.ReactNode;
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}

export function ToastProvider({
    children,
    position = "bottom-right",
}: ToastProviderProps) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        // Auto remove after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const clearToasts = React.useCallback(() => {
        setToasts([]);
    }, []);

    const positionClasses = {
        "top-right": "top-4 right-4",
        "top-left": "top-4 left-4",
        "bottom-right": "bottom-4 right-4",
        "bottom-left": "bottom-4 left-4",
        "top-center": "top-4 left-1/2 -translate-x-1/2",
        "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
            {children}
            <div
                className={cn(
                    "fixed z-[9999] flex flex-col gap-2 pointer-events-none",
                    positionClasses[position]
                )}
            >
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

// Individual Toast Item
interface ToastItemProps {
    toast: Toast;
    onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
    const typeConfig = {
        success: {
            icon: CheckCircle2,
            bg: "bg-accent-green/10 border-accent-green/30",
            iconColor: "text-accent-green",
        },
        error: {
            icon: AlertCircle,
            bg: "bg-accent-red/10 border-accent-red/30",
            iconColor: "text-accent-red",
        },
        warning: {
            icon: AlertTriangle,
            bg: "bg-accent-gold/10 border-accent-gold/30",
            iconColor: "text-accent-gold",
        },
        info: {
            icon: Info,
            bg: "bg-accent-blue/10 border-accent-blue/30",
            iconColor: "text-accent-blue",
        },
    };

    const config = typeConfig[toast.type];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={cn(
                "pointer-events-auto w-full max-w-sm p-4 rounded-xl border backdrop-blur-xl shadow-xl",
                "bg-stadium-elevated/95",
                config.bg
            )}
        >
            <div className="flex items-start gap-3">
                <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconColor)} />
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text-primary">{toast.title}</h4>
                    {toast.description && (
                        <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                            {toast.description}
                        </p>
                    )}
                    {toast.action && (
                        <button
                            onClick={() => {
                                toast.action!.onClick();
                                onClose();
                            }}
                            className="mt-2 text-sm font-semibold text-accent-green hover:underline"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 -m-1 text-text-muted hover:text-text-primary rounded-full hover:bg-white/10 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </motion.div>
    );
}

// Helper functions for quick toast creation
export function toast(props: Omit<Toast, "id">) {
    // This is a placeholder - actual implementation needs context
    console.warn("Toast called outside of ToastProvider");
}
