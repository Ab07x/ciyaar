"use client";

import Link from "next/link";
import Image from "next/image";

interface PremiumPromoBannerProps {
  className?: string;
}

export function PremiumPromoBanner({ className }: PremiumPromoBannerProps) {
  return (
    <div className={`relative text-center bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-card)] to-black border border-[var(--color-premium)]/20 rounded-2xl px-3 sm:px-6 py-3 sm:py-6 lg:py-8 ${className || ""}`}>
      <div className="w-full sm:max-w-[90%] md:max-w-[50%] mx-auto pb-2">

        {/* Mobile: Cartoons + Heading Row */}
        <div className="flex items-center gap-4 justify-center max-md:mb-3">
          {/* Left Cartoon - Mobile */}
          <div className="md:hidden rounded-full">
            <div className="relative">
              <Image
                src="/img/blue-gems.svg"
                width={16}
                height={16}
                className="absolute -bottom-1 -left-1"
                alt=""
              />
              <Image
                src="/img/dragon-left.png"
                alt="Cartoon"
                width={80}
                height={80}
                className="shadow-[0px_8px_10px_-6px_rgba(0,0,0,0.1)] rounded-full max-h-[60px] sm:max-h-20 object-contain w-auto"
              />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-white text-xl sm:text-xl font-poppins lg:leading-[30px] lg:text-[26px] font-normal md:mb-4">
            Ads suck but <br /> keep the site <span className="font-bold bg-gradient-to-r from-[#9AE600] via-[#9AE600] to-[#FE9A00] bg-clip-text text-transparent">free.</span>
          </h2>

          {/* Right Cartoon - Mobile */}
          <div className="md:hidden rounded-full">
            <div className="relative">
              <Image
                src="/img/rating-star.svg"
                width={16}
                height={16}
                className="size-[11px] sm:size-4 absolute left-[3px] -top-[3px]"
                alt=""
              />
              <Image
                src="/img/right-cartoons.png"
                alt="Cartoon"
                width={80}
                height={80}
                className="shadow-[0px_8px_10px_-6px_rgba(0,0,0,0.1)] rounded-full max-h-[60px] sm:max-h-20 object-contain w-auto"
              />
            </div>
          </div>
        </div>

        {/* Paragraph */}
        <p className="text-[var(--color-text-secondary)] mb-5 text-base lg:text-lg font-poppins">
          Remove ads and get many features with{" "}
          <Link
            href="/pricing"
            className="!text-[var(--color-premium)] underline font-bold hover:brightness-110 transition-colors"
          >
            Premium Membership
          </Link>
        </p>

        {/* Right Cartoon - Desktop */}
        <div className="hidden md:block absolute top-1/2 -translate-y-1/2 right-[30px] lg:right-[40px] rounded-full">
          <div className="relative">
            <Image
              src="/img/blue-gems.svg"
              width={24}
              height={24}
              className="absolute -right-2 -top-4"
              alt=""
            />
            <Image
              src="/img/rounded-rating.svg"
              width={24}
              height={24}
              className="absolute top-0 right-6"
              alt=""
            />
            <Image
              src="/img/right-cartoons.png"
              alt="Cartoon"
              width={168}
              height={168}
              className="shadow-[0px_8px_10px_-6px_rgba(0,0,0,0.1)] border-[4px] border-[#45547f] rounded-full max-h-20 md:max-h-[130px] lg:max-h-[168px] object-contain w-auto"
            />
          </div>
        </div>

        {/* Left Cartoon - Desktop */}
        <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-[30px] lg:left-[40px] rounded-full">
          <div className="relative">
            <Image
              src="/img/rating-star.svg"
              width={24}
              height={24}
              className="absolute -left-2 -top-4"
              alt=""
            />
            <Image
              src="/img/heart.svg"
              width={16}
              height={16}
              className="absolute -bottom-2 left-4"
              alt=""
            />
            <Image
              src="/img/rounded-heart.svg"
              width={24}
              height={24}
              className="absolute top-0 right-6"
              alt=""
            />
            <Image
              src="/img/dragon-left.png"
              alt="Cartoon"
              width={168}
              height={168}
              className="shadow-[0px_8px_10px_-6px_rgba(0,0,0,0.1)] border-[4px] border-[#45547f] rounded-full max-h-20 md:max-h-[130px] lg:max-h-[168px] object-contain w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
