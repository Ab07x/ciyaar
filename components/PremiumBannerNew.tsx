"use client";

import Image from "next/image";
import Link from "next/link";

interface PremiumBannerNewProps {
    className?: string;
    showImagesOnMobile?: boolean; // New prop to control mobile image visibility if needed, default true per user request
}

export default function PremiumBannerNew({ className, showImagesOnMobile = true }: PremiumBannerNewProps) {
    return (
        <div className={`w-full max-w-4xl mx-auto my-6 px-4 ${className || ""}`}>
            <div className="relative bg-[#111827] bg-opacity-95 rounded-2xl p-4 md:p-6 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] overflow-hidden">
                {/* Decorative elements - matched to reference */}
                <div className="absolute top-3 left-3 text-yellow-400 text-sm animate-pulse">⭐</div>
                <div className="absolute top-1/4 left-1/4 text-blue-400/20 text-xl">✨</div>
                <div className="absolute bottom-4 right-1/4 text-purple-400/20 text-lg">✨</div>
                <div className="absolute top-4 right-4 text-blue-300 text-xs">✦</div>

                <div className="flex flex-row items-center justify-between gap-2 md:gap-6 relative z-10">
                    {/* Left Image - Toothless */}
                    <div className={`${showImagesOnMobile ? 'block' : 'hidden'} md:block relative w-16 h-16 md:w-28 md:h-28 flex-shrink-0 -ml-2 md:ml-0`}>
                        <Image
                            src="/img/dragon-left.png"
                            alt="Premium"
                            fill
                            className="object-contain drop-shadow-xl"
                        />
                    </div>

                    {/* Center Content */}
                    <div className="flex-1 text-center min-w-0">
                        <h3 className="text-[15px] md:text-2xl font-bold text-white mb-1 md:mb-2 leading-tight">
                            Ads suck but keep the site <span className="text-[#9AE600]">free</span>.
                        </h3>
                        <p className="text-gray-400 text-[10px] md:text-sm mb-3 md:mb-5 leading-relaxed">
                            Remove ads and get many features with <br className="md:hidden" />
                            <Link href="/pricing" className="text-[#fbbf24] hover:text-[#f59e0b] font-semibold transition-colors">
                                Premium Membership
                            </Link>
                        </p>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 md:px-8 md:py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs md:text-sm font-bold rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                        >
                            <span className="text-yellow-300">✨</span>
                            CHECK OPTIONS
                        </Link>
                    </div>

                    {/* Right Image - Incredibles */}
                    <div className={`${showImagesOnMobile ? 'block' : 'hidden'} md:block relative w-16 h-16 md:w-28 md:h-28 flex-shrink-0 -mr-2 md:mr-0`}>
                        <Image
                            src="/img/right-cartoons.png"
                            alt="Characters"
                            fill
                            className="object-contain drop-shadow-xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
