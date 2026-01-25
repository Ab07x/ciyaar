"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Locale } from "@/lib/i18n";

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
    dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("so");

    useEffect(() => {
        // Load preference
        const saved = localStorage.getItem("fanbroj_locale") as Locale;
        if (saved && ["so", "en", "ar"].includes(saved)) {
            setLocaleState(saved);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("fanbroj_locale", newLocale);

        // Update document direction
        const dir = newLocale === "ar" ? "rtl" : "ltr";
        document.documentElement.dir = dir;
        document.documentElement.lang = newLocale;
    };

    // Initial render effect to set dir
    useEffect(() => {
        const dir = locale === "ar" ? "rtl" : "ltr";
        document.documentElement.dir = dir;
        document.documentElement.lang = locale;
    }, [locale]);

    const t = (key: string): string => {
        const keys = key.split(".");
        let value: any = translations[locale];

        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k];
            } else {
                // Fallback to Somali if missing
                let fallback: any = translations["so"];
                for (const fk of keys) {
                    if (fallback && typeof fallback === "object" && fk in fallback) {
                        fallback = fallback[fk];
                    } else {
                        return key; // Return key if absolutely nothing found
                    }
                }
                return fallback || key;
            }
        }

        return typeof value === "string" ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, dir: locale === "ar" ? "rtl" : "ltr" }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
