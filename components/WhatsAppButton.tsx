"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WhatsAppButtonProps {
    className?: string;
    showLabel?: boolean;
}

export function WhatsAppButton({ className, showLabel = true }: WhatsAppButtonProps) {
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { isPremium } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Only show WhatsApp support button to paid/premium users
    if (!isPremium) return null;

    // Default valid phone if settings fail to load
    const phone = settings?.whatsappNumber?.replace(/[^0-9]/g, "") || "252618274188";
    const message = encodeURIComponent("Asc, waxaan rabaa caawinaad – waxaan ahay macmiil Premium ✅");
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-2 px-4 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105",
                className
            )}
            aria-label="Contact Premium Support on WhatsApp"
        >
            <MessageCircle size={24} fill="white" className="text-[#25D366]" />
            {showLabel && <span>WhatsApp Support</span>}
        </a>
    );
}
