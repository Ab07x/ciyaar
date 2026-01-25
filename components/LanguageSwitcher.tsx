"use client";

import React, { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: "so", label: "Somali", flag: "🇸🇴" },
        { code: "en", label: "English", flag: "🇺🇸" },
        { code: "ar", label: "العربية", flag: "🇸🇦" },
    ] as const;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-primary hover:bg-stadium-hover rounded-lg transition-colors"
                aria-label="Change Language"
            >
                <Globe size={22} className="text-text-muted hover:text-white transition-colors" />
                <span className="sr-only">Change Language</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-full mt-2 w-40 bg-stadium-elevated border border-border-subtle rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLocale(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-4 py-3 flex items-center gap-3 text-sm font-bold transition-all hover:bg-white/5",
                                        locale === lang.code ? "text-accent-green bg-white/5" : "text-text-secondary"
                                    )}
                                >
                                    <span className="text-xl">{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
