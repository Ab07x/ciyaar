"use client";

import Link from "next/link";
import Image from "next/image";

interface PremiumPromoBannerProps {
  className?: string;
}

export function PremiumPromoBanner({ className }: PremiumPromoBannerProps) {
  return (
    <div className={`flex justify-center px-4 ${className || ""}`}>
      <div className="relative w-full max-w-2xl bg-gradient-to-r from-[#1a3a5c] via-[#1e4976] to-[#1a3a5c] border-2 border-[#3b82f6] rounded-2xl px-6 py-6 md:py-8">

        {/* Left Character */}
        <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2">
          <div className="relative">
            {/* Star icon */}
            <Image
              src="/img/rating-star.svg"
              width={20}
              height={20}
              className="absolute -top-2 -left-1 w-4 h-4 md:w-5 md:h-5"
              alt=""
            />
            {/* Dragon image */}
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#3b82f6] bg-[#1a3a5c]">
              <Image
                src="/img/dragon-left.png"
                alt="Character"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Blue gems below */}
            <Image
              src="/img/blue-gems.svg"
              width={16}
              height={16}
              className="absolute -bottom-1 -left-2 w-3 h-3 md:w-4 md:h-4"
              alt=""
            />
          </div>
        </div>

        {/* Right Character */}
        <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2">
          <div className="relative">
            {/* Gems icon */}
            <Image
              src="/img/blue-gems.svg"
              width={20}
              height={20}
              className="absolute -top-2 -right-1 w-4 h-4 md:w-5 md:h-5"
              alt=""
            />
            {/* Incredibles image */}
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#3b82f6] bg-[#1a3a5c]">
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

        {/* Center Content */}
        <div className="text-center px-16 md:px-24">
          <h2 className="text-white text-base md:text-xl font-semibold leading-tight mb-2">
            Ads suck but<br />
            keep the site <span className="text-[#9AE600] font-bold">free.</span>
          </h2>

          <p className="text-gray-300 text-xs md:text-sm mb-4">
            Remove ads and get many features with{" "}
            <Link
              href="/pricing"
              className="text-[#9AE600] underline font-semibold hover:brightness-110 transition-colors"
            >
              Premium Membership
            </Link>
          </p>

          {/* CTA Button */}
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#9AE600] hover:bg-[#8bd600] text-black font-bold text-sm px-5 py-2 rounded-full transition-all hover:scale-105"
          >
            <span>👑</span>
            CHECK OPTIONS
          </Link>
        </div>
      </div>
    </div>
  );
}
