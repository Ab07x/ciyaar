"use client";

import Link from "next/link";
import Image from "next/image";

interface PremiumPromoBannerProps {
  className?: string;
}

export function PremiumPromoBanner({ className }: PremiumPromoBannerProps) {
  return (
    <div className={`flex justify-center px-4 py-2 ${className || ""}`}>
      <div className="relative w-full max-w-3xl bg-gradient-to-r from-[#1a3a5c] via-[#1e4976] to-[#1a3a5c] border border-[#3b82f6]/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-3 md:px-6 md:py-4">

          {/* Left Character - Dragon */}
          <div className="relative flex-shrink-0">
            {/* Star decoration */}
            <span className="absolute -top-1 -left-1 text-yellow-400 text-base md:text-xl">★</span>
            {/* Blue dot */}
            <span className="absolute top-1 right-0 w-2 h-2 md:w-3 md:h-3 bg-cyan-400 rounded-full"></span>

            {/* Dragon circle */}
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#3b82f6]/50 bg-[#1a3a5c]">
              <Image
                src="/img/dragon-left.png"
                alt="Character"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Heart decoration */}
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-pink-400 text-xs md:text-sm">♥</span>
          </div>

          {/* Center Content */}
          <div className="flex-1 text-center px-2 md:px-4">
            <h3 className="text-white text-xs md:text-base font-semibold leading-tight">
              Ads suck but
            </h3>
            <h3 className="text-white text-xs md:text-base font-semibold leading-tight mb-0.5 md:mb-1">
              keep the site <span className="text-[#9AE600] font-bold">free.</span>
            </h3>
            <p className="text-gray-300 text-[9px] md:text-xs mb-1.5 md:mb-2">
              Remove ads and get many features with{" "}
              <Link href="/pricing" className="text-[#9AE600] underline font-semibold hover:brightness-110">
                Premium Membership
              </Link>
            </p>

            {/* CTA Button */}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 md:gap-2 bg-[#2a4a6a] hover:bg-[#3a5a7a] border border-[#4a7a9a]/50 text-white font-bold text-[10px] md:text-sm px-2.5 py-1 md:px-4 md:py-1.5 rounded-full transition-all"
            >
              <span className="text-[#9AE600]">✦</span>
              CHECK OPTIONS
            </Link>
          </div>

          {/* Right Character - Incredibles */}
          <div className="relative flex-shrink-0">
            {/* Sparkle decoration */}
            <span className="absolute -top-1 -right-1 text-[#9AE600] text-base md:text-xl">✦</span>

            {/* Incredibles circle */}
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#3b82f6]/50 bg-[#1a3a5c]">
              <Image
                src="/img/right-cartoons.png"
                alt="Character"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
