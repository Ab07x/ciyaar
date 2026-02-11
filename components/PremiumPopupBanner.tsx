"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
import { useUser } from "@/providers/UserProvider";

interface PremiumPopupBannerProps {
    onClose?: () => void;
    show?: boolean;
}

export function PremiumPopupBanner({ onClose, show = true }: PremiumPopupBannerProps) {
    const { isPremium } = useUser();
    const { data: banner } = useSWR("/api/promo-banners?type=popup", fetcher);
    const [isVisible, setIsVisible] = useState(show);

    // Sync visibility with props
    useEffect(() => {
        setIsVisible(show);
    }, [show]);

    // Don't show if user is premium or banner not found or manually closed
    if (isPremium || !banner || !isVisible) return null;

    // Default values if fields missing
    const headline = banner.headline || "Qaybtan Waxaa loogu talagalay Macaamiisha";
    const subheadline = banner.subheadline || "Markaad ku biirto Premium, waxaad heleysaa waxyaabo gaar ah.";
    const ctaText = banner.ctaText || "EEG NOOCYADA";
    const ctaLink = banner.ctaLink || "/pricing";
    const imageUrl = banner.leftImageUrl || "/premium-ad/movie-celebraty-min.png";
    const backgroundColor = banner.backgroundColor || "#2D2640";
    const accentColor = banner.accentColor || "#FF8F8F";

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-2xl rounded-2xl overflow-visible shadow-2xl flex flex-col md:flex-row"
                style={{ backgroundColor }}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Left Image (Character) - Overhanging on desktop */}
                <div className="relative w-full md:w-5/12 h-64 md:h-auto flex-shrink-0">
                    {/* Image Container - positioned to overflow on desktop */}
                    <div className="absolute bottom-0 left-0 md:-left-4 w-full h-full md:h-[115%] flex items-end justify-center md:justify-start">
                        <div className="relative w-48 h-56 md:w-64 md:h-[300px]">
                            <Image
                                src={imageUrl}
                                alt="Premium Character"
                                fill
                                className="object-contain object-bottom drop-shadow-2xl"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="relative flex-1 p-6 md:p-8 md:pl-0 flex flex-col justify-center text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                        {headline}
                    </h2>

                    <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed">
                        {subheadline}
                    </p>

                    <div className="flex justify-center">
                        <Link
                            href={ctaLink}
                            className="px-8 py-3 rounded-lg font-bold text-white shadow-lg transform transition-all hover:scale-105 active:scale-95 text-sm md:text-base uppercase tracking-wide"
                            style={{
                                backgroundColor: accentColor,
                                boxShadow: `0 4px 14px 0 ${accentColor}66`
                            }}
                        >
                            {ctaText}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
