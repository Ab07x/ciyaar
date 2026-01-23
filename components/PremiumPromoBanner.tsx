"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PremiumPromoBannerProps {
  className?: string;
  type?: "main" | "small";
}

export function PremiumPromoBanner({ className, type = "main" }: PremiumPromoBannerProps) {
  const banner = useQuery(api.promoBanners.getActiveBanner, { type });

  // Default values if no banner in database
  const headline = banner?.headline || "Ads suck but keep the site free.";
  const subheadline = banner?.subheadline || "Remove ads and get many features with Premium Membership";
  const ctaText = banner?.ctaText || "CHECK OPTIONS";
  const ctaLink = banner?.ctaLink || "/pricing";
  const leftImageUrl = banner?.leftImageUrl || "/img/dragon-left.png";
  const rightImageUrl = banner?.rightImageUrl || "/img/right-cartoons.png";
  const backgroundColor = banner?.backgroundColor || "#1a3a5c";
  const accentColor = banner?.accentColor || "#9AE600";

  // Split headline for styling
  const headlineParts = headline.split("free.");
  const hasFreePart = headlineParts.length > 1;

  return (
    <div className={`flex justify-center px-4 py-2 ${className || ""}`}>
      <div
        className="relative w-full max-w-3xl border border-[#3b82f6]/50 rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${backgroundColor}, ${backgroundColor}dd, ${backgroundColor})`,
        }}
      >
        <div className="flex items-center justify-between px-3 py-3 md:px-6 md:py-4">

          {/* Left Character */}
          <div className="relative flex-shrink-0">
            {/* Star decoration */}
            <span className="absolute -top-1 -left-1 text-yellow-400 text-base md:text-xl">★</span>
            {/* Blue dot */}
            <span className="absolute top-1 right-0 w-2 h-2 md:w-3 md:h-3 bg-cyan-400 rounded-full"></span>

            {/* Character circle */}
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#3b82f6]/50 bg-[#1a3a5c]">
              {leftImageUrl && (
                <Image
                  src={leftImageUrl}
                  alt="Character"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Heart decoration */}
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-pink-400 text-xs md:text-sm">♥</span>
          </div>

          {/* Center Content */}
          <div className="flex-1 text-center px-2 md:px-4">
            {hasFreePart ? (
              <>
                <h3 className="text-white text-xs md:text-base font-semibold leading-tight">
                  {headlineParts[0].trim()}
                </h3>
                <h3 className="text-white text-xs md:text-base font-semibold leading-tight mb-0.5 md:mb-1">
                  <span style={{ color: accentColor }} className="font-bold">free.</span>
                </h3>
              </>
            ) : (
              <h3 className="text-white text-xs md:text-base font-semibold leading-tight mb-0.5 md:mb-1">
                {headline}
              </h3>
            )}
            <p className="text-gray-300 text-[9px] md:text-xs mb-1.5 md:mb-2">
              {subheadline.includes("Premium Membership") ? (
                <>
                  {subheadline.split("Premium Membership")[0]}
                  <Link href={ctaLink} className="underline font-semibold hover:brightness-110" style={{ color: accentColor }}>
                    Premium Membership
                  </Link>
                  {subheadline.split("Premium Membership")[1] || ""}
                </>
              ) : (
                subheadline
              )}
            </p>

            {/* CTA Button */}
            <Link
              href={ctaLink}
              className="inline-flex items-center gap-1 md:gap-2 bg-[#2a4a6a] hover:bg-[#3a5a7a] border border-[#4a7a9a]/50 text-white font-bold text-[10px] md:text-sm px-2.5 py-1 md:px-4 md:py-1.5 rounded-full transition-all"
            >
              <span style={{ color: accentColor }}>✦</span>
              {ctaText}
            </Link>
          </div>

          {/* Right Character */}
          <div className="relative flex-shrink-0">
            {/* Sparkle decoration */}
            <span className="absolute -top-1 -right-1 text-base md:text-xl" style={{ color: accentColor }}>✦</span>

            {/* Character circle */}
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#3b82f6]/50 bg-[#1a3a5c]">
              {rightImageUrl && (
                <Image
                  src={rightImageUrl}
                  alt="Character"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
