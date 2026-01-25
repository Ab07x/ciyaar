"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-accent-red/10 flex items-center justify-center mb-6 ring-1 ring-accent-red/20">
                <AlertCircle className="w-10 h-10 text-accent-red" />
            </div>

            <h2 className="text-3xl md:text-4xl font-black mb-3 uppercase tracking-tight">
                Khalad Farsamo!
            </h2>

            <p className="text-text-secondary max-w-md mb-8">
                Waxaan la kulannay cilad farsamo. Fadlan isku day markale ama nala soo xiriir haddii ciladu sii jirto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    onClick={reset}
                    variant="primary"
                    leftIcon={<RefreshCw size={18} />}
                >
                    Isku Day Markale
                </Button>

                <Link href="/">
                    <Button
                        variant="secondary"
                        leftIcon={<Home size={18} />}
                    >
                        Ku Noqo Guriga
                    </Button>
                </Link>
            </div>

            {process.env.NODE_ENV === "development" && (
                <div className="mt-12 p-4 bg-black/40 border border-white/5 rounded-lg max-w-2xl w-full text-left overflow-auto">
                    <p className="font-mono text-xs text-red-400 mb-2">Error Digest: {error.digest}</p>
                    <pre className="font-mono text-xs text-text-tertiary whitespace-pre-wrap">
                        {error.message}
                        {error.stack}
                    </pre>
                </div>
            )}
        </div>
    );
}
