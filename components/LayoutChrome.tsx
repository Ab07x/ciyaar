"use client";

import { usePathname } from "next/navigation";

/** Pages that render as standalone (no footer, banners, WhatsApp, etc.) */
const CLEAN_PAGES = ["/login", "/pay", "/premium", "/profile", "/pricing"];

export function LayoutChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isClean = CLEAN_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"));
    if (isClean) return null;
    return <>{children}</>;
}
