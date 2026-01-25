"use client";

import "./globals.css";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

// Global error must include html and body tags
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="so">
            <body className="antialiased bg-[var(--bg-primary)] text-[var(--color-text-primary)] min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-red/20 to-transparent flex items-center justify-center mb-8 border border-accent-red/20 shadow-2xl shadow-accent-red/10">
                        <AlertTriangle className="w-12 h-12 text-accent-red" />
                    </div>

                    <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">
                        System Failure
                    </h1>

                    <p className="text-text-secondary mb-8 leading-relaxed">
                        Waxaa dhacay khalad halis ah oo aan la filayn.
                        <br />
                        Our technicians have been notified.
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <Button
                            onClick={reset}
                            variant="primary"
                            size="lg"
                            className="w-full"
                            leftIcon={<RefreshCw size={18} />}
                        >
                            Dib u billow (Reload)
                        </Button>

                        <Button
                            onClick={() => window.location.href = "/"}
                            variant="secondary"
                            size="lg"
                            className="w-full"
                            leftIcon={<Home size={18} />}
                        >
                            Ku Noqo Guriga
                        </Button>
                    </div>

                    <div className="mt-12 text-xs text-text-tertiary">
                        Fanbroj Entertainment Systems
                    </div>
                </div>
            </body>
        </html>
    );
}
