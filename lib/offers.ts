/**
 * lib/offers.ts — Central offer configuration.
 * A/B assignment, flash sale schedule, social proof pool, referral utilities.
 */

// ── A/B Test ──────────────────────────────────────────────────────────────────

export type OfferVariant = "A" | "B";

/**
 * Deterministic A/B variant from deviceId hash.
 * Same device always gets the same variant across sessions.
 * salt differentiates multiple concurrent tests.
 */
export function getABVariant(deviceId: string, salt = ""): OfferVariant {
    const str = `${deviceId}::${salt}`;
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return (Math.abs(hash) % 2 === 0) ? "A" : "B";
}

// ── Flash Sales ───────────────────────────────────────────────────────────────

export type FlashSale = {
    id: string;
    nameEn: string;
    nameSo: string;
    discountPct: number;
    offerCode: string;
    bonusDays: number;
    startMs: number;
    endMs: number;
    accentColor: string;
    emoji: string;
    headlineEn: string;
    headlineSo: string;
    subEn: string;
    subSo: string;
};

const Y = 2026;

export const FLASH_SALES: FlashSale[] = [
    {
        id: "ramadan_2026",
        nameEn: "Ramadan Special",
        nameSo: "Xaflad Ramadan 2026",
        discountPct: 30,
        offerCode: "RAMADAN26",
        bonusDays: 10,
        startMs: new Date(`${Y}-03-01`).getTime(),
        endMs:   new Date(`${Y}-03-31T23:59:59`).getTime(),
        accentColor: "#f59e0b",
        emoji: "🌙",
        headlineEn: "Ramadan Offer — 30% Off Premium",
        headlineSo: "Xaflad Ramadan — 30% Ka Dhimid",
        subEn:  "Daawo filimadaada iyo ciyaarka Ramadan oo dhan bilaa xayeysiis.",
        subSo:  "Watch all Ramadan & football without ads — limited time offer.",
    },
    {
        id: "eid_2026",
        nameEn: "Eid Special",
        nameSo: "Xaflad Ciid Fiir 2026",
        discountPct: 40,
        offerCode: "EID26",
        bonusDays: 14,
        startMs: new Date(`${Y}-03-29`).getTime(),
        endMs:   new Date(`${Y}-04-03T23:59:59`).getTime(),
        accentColor: "#10b981",
        emoji: "🌟",
        headlineEn: "Eid Mubarak! 40% Off + 14 Bonus Days",
        headlineSo: "Ciid Wanaagsan! 40% Ka Dhimid + 14 Maalmood",
        subEn:  "Biggest discount of the year. Celebrate Eid with HD streaming.",
        subSo:  "Qiimaha ugu hooseeya sanadka. Ciidda ku daawow HD.",
    },
    {
        id: "independence_2026",
        nameEn: "Somali Independence Day",
        nameSo: "Maalinta Xorriyadda Soomaaliya",
        discountPct: 26,
        offerCode: "JULY1_26",
        bonusDays: 7,
        startMs: new Date(`${Y}-06-30`).getTime(),
        endMs:   new Date(`${Y}-07-03T23:59:59`).getTime(),
        accentColor: "#3b82f6",
        emoji: "🇸🇴",
        headlineEn: "Happy Independence Day! 26% Off",
        headlineSo: "Maalinta Xorriyadda! 26% Ka Dhimid",
        subEn:  "Celebrate Somalia's independence with Premium for less.",
        subSo:  "Xorriyadda ku daawow Premium qiimo jaban.",
    },
];

export function getActiveFlashSale(): FlashSale | null {
    const now = Date.now();
    return FLASH_SALES.find(s => now >= s.startMs && now <= s.endMs) ?? null;
}

/** ms remaining until flash sale ends, or 0 */
export function getFlashSaleRemainingMs(sale: FlashSale): number {
    return Math.max(0, sale.endMs - Date.now());
}

// ── Social Proof Pool ─────────────────────────────────────────────────────────
// Realistic Somali diaspora names + cities. Used when real payment data is sparse.

export const SOCIAL_PROOF_POOL = [
    { name: "Axmed",    city: "Minneapolis" },
    { name: "Fadumo",   city: "London"      },
    { name: "Cabdi",    city: "Nairobi"     },
    { name: "Hodan",    city: "Toronto"     },
    { name: "Mahad",    city: "Stockholm"   },
    { name: "Sahra",    city: "Minneapolis" },
    { name: "Xuseen",   city: "Oslo"        },
    { name: "Maryan",   city: "Dubai"       },
    { name: "Faarax",   city: "Columbus"    },
    { name: "Asad",     city: "Melbourne"   },
    { name: "Warsan",   city: "San Diego"   },
    { name: "Ibraahim", city: "Copenhagen"  },
    { name: "Layla",    city: "Ottawa"      },
    { name: "Bashir",   city: "Mogadishu"   },
    { name: "Nimco",    city: "Leicester"   },
    { name: "Yuusuf",   city: "Rotterdam"   },
    { name: "Hawo",     city: "Helsinki"    },
    { name: "Mustafe",  city: "Atlanta"     },
    { name: "Caasha",   city: "Djibouti"    },
    { name: "Deeqa",    city: "Seattle"     },
    { name: "Salim",    city: "Riyadh"      },
    { name: "Khadiija", city: "Bristol"     },
    { name: "Jamaal",   city: "Minneapolis" },
    { name: "Ikraan",   city: "Gothenburg"  },
    { name: "Nafiso",   city: "Columbus"    },
    { name: "Cumar",    city: "London"      },
    { name: "Faadumo",  city: "San Jose"    },
    { name: "Rashid",   city: "Hargeisa"    },
    { name: "Hibo",     city: "Amsterdam"   },
    { name: "Mukhtaar", city: "Dallas"      },
];

// ── Offer Copy ────────────────────────────────────────────────────────────────

/** Launch offer variants for A/B test */
export const LAUNCH_OFFER = {
    /** Variant A: $1 first month */
    A: {
        headlineEn: "First Month for $1",
        headlineSo: "Bishii Kowaad — $1 Kaliya",
        subEn:  "Then just $3.20/month. Cancel anytime.",
        subSo:  "Kadibna $3.20 bishii. Xidid goor kasta.",
        badge:  "LIMITED OFFER",
        ctaEn:  "Start for $1",
        ctaSo:  "KU BILOW $1",
    },
    /** Variant B: 7-day free trial */
    B: {
        headlineEn: "7-Day Free Trial",
        headlineSo: "7 Maalmood Bilaash",
        subEn:  "Full Premium access. No credit card needed.",
        subSo:  "Dhammaan Premium. Kaarka lacagta looma baahna.",
        badge:  "FREE TRIAL",
        ctaEn:  "Start Free Trial",
        ctaSo:  "BILOW TIJAABO BILAASH",
    },
} as const;

/** Exit intent offer: 50% off */
export const EXIT_OFFER = {
    headlineEn: "Wait! 50% Off — Today Only",
    headlineSo: "Joog! 50% Ka Dhimid — Maanta Kaliya",
    subEn:  "Don't leave empty-handed. Get Premium at half price.",
    subSo:  "Ha aadin. Premium ka hel qiimaha badh.",
    offerCode: "EXIT50",
    discountPct: 50,
};
