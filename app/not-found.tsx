"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MoveLeft, SearchX, TicketX } from "lucide-react";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
            {/* Visual Icon */}
            <div className="relative mb-8">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5 flex items-center justify-center border border-white/10 animate-pulse">
                    <TicketX className="w-12 h-12 md:w-16 md:h-16 text-accent-red opacity-80" />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-accent-green/20 rounded-tr-2xl" />
                <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-accent-green/20 rounded-bl-2xl" />
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase font-display">
                404
            </h1>

            <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">
                Garoonka Lama Helin
            </h2>

            <p className="text-text-secondary max-w-md mb-8 text-sm md:text-base leading-relaxed">
                Raali ahoow, bogga aad raadineyso ma jiro ama waa la raray.
                Waxaad moodaa in ciyaartan la joojiyay ama tikidhkaagu uu dhacay.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/">
                    <Button
                        variant="primary"
                        size="lg"
                        leftIcon={<MoveLeft size={18} />}
                    >
                        Ku Noqo Guriga
                    </Button>
                </Link>

                <Link href="/ciyaar">
                    <Button
                        variant="ghost"
                        size="lg"
                    >
                        Ciyaaraha
                    </Button>
                </Link>
            </div>
        </div>
    );
}
