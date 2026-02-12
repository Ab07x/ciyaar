"use client";

import { Share2, MessageCircle, Facebook, Twitter, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialShareProps {
    title: string;
    url: string;
    className?: string;
}

export function SocialShare({ title, url, className }: SocialShareProps) {
    const shareUrl = url.startsWith("http") ? url : `https://fanbroj.net${url}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const links = [
        {
            name: "WhatsApp",
            icon: MessageCircle,
            href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            color: "hover:text-[#25D366] hover:bg-[#25D366]/10",
        },
        {
            name: "Telegram",
            icon: Send,
            href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
            color: "hover:text-[#0088cc] hover:bg-[#0088cc]/10",
        },
        {
            name: "Facebook",
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: "hover:text-[#1877F2] hover:bg-[#1877F2]/10",
        },
        {
            name: "X",
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            color: "hover:text-white hover:bg-white/10",
        },
    ];

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-2">Share:</span>
            {links.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "p-2 rounded-lg transition-all duration-200 text-text-muted flex items-center gap-2 group",
                        link.color
                    )}
                    title={`Share on ${link.name}`}
                >
                    <link.icon size={18} />
                    <span className="text-xs font-bold hidden md:inline">{link.name}</span>
                </a>
            ))}
        </div>
    );
}
