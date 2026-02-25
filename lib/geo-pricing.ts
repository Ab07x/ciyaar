/**
 * Geo-based pricing tiers with absolute prices per plan.
 *
 * Tier 0 — Somalia / Djibouti       → Local gateway (EVC/Zaad/Sahal), no card
 * Tier 1 — East Africa / South Asia → Mixed (M-Pesa, local + card)
 * Tier 2 — Middle East / Gulf / EE  → Card / PayPal
 * Tier 3 — Western / High-income    → Card / PayPal, $1 trial eligible
 * DEFAULT — Unknown country          → Tier 2 pricing
 */

export type TierLevel = 0 | 1 | 2 | 3;

export type GeoTier = {
    name: string;
    tier: TierLevel;
    /** Legacy multiplier kept for backward-compat with existing checkout routes */
    multiplier: number;
};

export const GEO_TIERS: Record<string, GeoTier> = {
    // ── Tier 0 — Somalia & Djibouti (local gateway only) ──────────────────
    SO: { name: "Somalia",  tier: 0, multiplier: 1.0 },
    DJ: { name: "Djibouti", tier: 0, multiplier: 1.0 },

    // ── Tier 1 — East Africa / South Asia / low-income ────────────────────
    KE: { name: "Kenya",             tier: 1, multiplier: 1.8 },
    ET: { name: "Ethiopia",          tier: 1, multiplier: 1.5 },
    UG: { name: "Uganda",            tier: 1, multiplier: 1.5 },
    TZ: { name: "Tanzania",          tier: 1, multiplier: 1.5 },
    ER: { name: "Eritrea",           tier: 1, multiplier: 1.3 },
    SD: { name: "Sudan",             tier: 1, multiplier: 1.3 },
    SS: { name: "South Sudan",       tier: 1, multiplier: 1.3 },
    RW: { name: "Rwanda",            tier: 1, multiplier: 1.5 },
    BI: { name: "Burundi",           tier: 1, multiplier: 1.3 },
    MG: { name: "Madagascar",        tier: 1, multiplier: 1.3 },
    MZ: { name: "Mozambique",        tier: 1, multiplier: 1.3 },
    ZW: { name: "Zimbabwe",          tier: 1, multiplier: 1.5 },
    ZM: { name: "Zambia",            tier: 1, multiplier: 1.5 },
    MW: { name: "Malawi",            tier: 1, multiplier: 1.3 },
    CM: { name: "Cameroon",          tier: 1, multiplier: 1.5 },
    GH: { name: "Ghana",             tier: 1, multiplier: 1.8 },
    NG: { name: "Nigeria",           tier: 1, multiplier: 1.8 },
    SN: { name: "Senegal",           tier: 1, multiplier: 1.5 },
    CI: { name: "Côte d'Ivoire",     tier: 1, multiplier: 1.5 },
    ML: { name: "Mali",              tier: 1, multiplier: 1.5 },
    CD: { name: "Congo - Kinshasa",  tier: 1, multiplier: 1.5 },
    AO: { name: "Angola",            tier: 1, multiplier: 1.5 },
    GN: { name: "Guinea",            tier: 1, multiplier: 1.5 },
    MR: { name: "Mauritania",        tier: 1, multiplier: 1.5 },
    SZ: { name: "Eswatini",          tier: 1, multiplier: 1.5 },
    GQ: { name: "Equatorial Guinea", tier: 1, multiplier: 1.5 },
    IN: { name: "India",             tier: 1, multiplier: 1.8 },
    PK: { name: "Pakistan",          tier: 1, multiplier: 1.5 },
    BD: { name: "Bangladesh",        tier: 1, multiplier: 1.5 },
    NP: { name: "Nepal",             tier: 1, multiplier: 1.3 },
    PH: { name: "Philippines",       tier: 1, multiplier: 1.8 },
    ID: { name: "Indonesia",         tier: 1, multiplier: 1.8 },
    AF: { name: "Afghanistan",       tier: 1, multiplier: 1.5 },
    MM: { name: "Myanmar",           tier: 1, multiplier: 1.5 },
    LA: { name: "Laos",              tier: 1, multiplier: 1.5 },
    KH: { name: "Cambodia",          tier: 1, multiplier: 1.5 },
    BT: { name: "Bhutan",            tier: 1, multiplier: 1.5 },
    ZA: { name: "South Africa",      tier: 1, multiplier: 2.0 },

    // ── Tier 2 — Middle East / Gulf / Eastern Europe / SE Asia ────────────
    AE: { name: "UAE",               tier: 2, multiplier: 2.5 },
    SA: { name: "Saudi Arabia",      tier: 2, multiplier: 2.5 },
    QA: { name: "Qatar",             tier: 2, multiplier: 2.5 },
    KW: { name: "Kuwait",            tier: 2, multiplier: 2.5 },
    BH: { name: "Bahrain",           tier: 2, multiplier: 2.5 },
    OM: { name: "Oman",              tier: 2, multiplier: 2.5 },
    YE: { name: "Yemen",             tier: 2, multiplier: 1.5 },
    IR: { name: "Iran",              tier: 2, multiplier: 2.0 },
    JO: { name: "Jordan",            tier: 2, multiplier: 2.0 },
    LB: { name: "Lebanon",           tier: 2, multiplier: 2.0 },
    IQ: { name: "Iraq",              tier: 2, multiplier: 2.0 },
    EG: { name: "Egypt",             tier: 2, multiplier: 1.8 },
    MA: { name: "Morocco",           tier: 2, multiplier: 2.0 },
    DZ: { name: "Algeria",           tier: 2, multiplier: 2.0 },
    TN: { name: "Tunisia",           tier: 2, multiplier: 2.0 },
    LY: { name: "Libya",             tier: 2, multiplier: 2.0 },
    TR: { name: "Turkey",            tier: 2, multiplier: 2.0 },
    LK: { name: "Sri Lanka",         tier: 2, multiplier: 2.0 },
    VN: { name: "Vietnam",           tier: 2, multiplier: 2.0 },
    MY: { name: "Malaysia",          tier: 2, multiplier: 2.5 },
    SG: { name: "Singapore",         tier: 2, multiplier: 2.5 },
    TH: { name: "Thailand",          tier: 2, multiplier: 2.0 },
    HK: { name: "Hong Kong",         tier: 2, multiplier: 2.5 },
    CN: { name: "China",             tier: 2, multiplier: 2.5 },
    TW: { name: "Taiwan",            tier: 2, multiplier: 2.5 },
    MX: { name: "Mexico",            tier: 2, multiplier: 2.0 },
    BR: { name: "Brazil",            tier: 2, multiplier: 2.0 },
    AR: { name: "Argentina",         tier: 2, multiplier: 2.0 },
    CL: { name: "Chile",             tier: 2, multiplier: 2.0 },
    CO: { name: "Colombia",          tier: 2, multiplier: 2.0 },
    PE: { name: "Peru",              tier: 2, multiplier: 2.0 },
    RU: { name: "Russia",            tier: 2, multiplier: 2.0 },
    BY: { name: "Belarus",           tier: 2, multiplier: 2.0 },
    KZ: { name: "Kazakhstan",        tier: 2, multiplier: 2.0 },
    KG: { name: "Kyrgyzstan",        tier: 2, multiplier: 2.0 },
    UZ: { name: "Uzbekistan",        tier: 2, multiplier: 2.0 },
    AZ: { name: "Azerbaijan",        tier: 2, multiplier: 2.0 },
    GE: { name: "Georgia",           tier: 2, multiplier: 2.0 },
    AM: { name: "Armenia",           tier: 2, multiplier: 2.0 },
    VE: { name: "Venezuela",         tier: 2, multiplier: 2.0 },
    YT: { name: "Mayotte",           tier: 2, multiplier: 2.0 },
    RE: { name: "Réunion",           tier: 2, multiplier: 2.0 },
    JP: { name: "Japan",             tier: 2, multiplier: 2.5 },
    KR: { name: "South Korea",       tier: 2, multiplier: 2.5 },
    RO: { name: "Romania",           tier: 2, multiplier: 2.0 },
    BG: { name: "Bulgaria",          tier: 2, multiplier: 2.0 },
    RS: { name: "Serbia",            tier: 2, multiplier: 2.0 },
    UA: { name: "Ukraine",           tier: 2, multiplier: 2.0 },
    AL: { name: "Albania",           tier: 2, multiplier: 2.0 },

    // ── Tier 3 — Western / High-income (diaspora, $1 trial eligible) ──────
    US: { name: "USA",               tier: 3, multiplier: 3.0 },
    CA: { name: "Canada",            tier: 3, multiplier: 3.0 },
    GB: { name: "United Kingdom",    tier: 3, multiplier: 3.0 },
    SE: { name: "Sweden",            tier: 3, multiplier: 3.0 },
    NO: { name: "Norway",            tier: 3, multiplier: 3.0 },
    DK: { name: "Denmark",           tier: 3, multiplier: 3.0 },
    FI: { name: "Finland",           tier: 3, multiplier: 3.0 },
    DE: { name: "Germany",           tier: 3, multiplier: 3.0 },
    NL: { name: "Netherlands",       tier: 3, multiplier: 3.0 },
    FR: { name: "France",            tier: 3, multiplier: 3.0 },
    CH: { name: "Switzerland",       tier: 3, multiplier: 3.0 },
    AT: { name: "Austria",           tier: 3, multiplier: 3.0 },
    BE: { name: "Belgium",           tier: 3, multiplier: 3.0 },
    LU: { name: "Luxembourg",        tier: 3, multiplier: 3.0 },
    AU: { name: "Australia",         tier: 3, multiplier: 3.0 },
    NZ: { name: "New Zealand",       tier: 3, multiplier: 3.0 },
    IE: { name: "Ireland",           tier: 3, multiplier: 3.0 },
    IS: { name: "Iceland",           tier: 3, multiplier: 3.0 },
    IL: { name: "Israel",            tier: 3, multiplier: 3.0 },
    IT: { name: "Italy",             tier: 3, multiplier: 2.5 },
    ES: { name: "Spain",             tier: 3, multiplier: 2.5 },
    PT: { name: "Portugal",          tier: 3, multiplier: 2.5 },
    PL: { name: "Poland",            tier: 3, multiplier: 2.5 },
    GR: { name: "Greece",            tier: 3, multiplier: 2.5 },
    CZ: { name: "Czech Republic",    tier: 3, multiplier: 2.5 },
    HU: { name: "Hungary",           tier: 3, multiplier: 2.5 },
    SK: { name: "Slovakia",          tier: 3, multiplier: 2.5 },
    HR: { name: "Croatia",           tier: 3, multiplier: 2.5 },
    SI: { name: "Slovenia",          tier: 3, multiplier: 2.5 },
    LV: { name: "Latvia",            tier: 3, multiplier: 2.5 },
    LI: { name: "Liechtenstein",     tier: 3, multiplier: 3.0 },
    CY: { name: "Cyprus",            tier: 3, multiplier: 2.5 },
    MT: { name: "Malta",             tier: 3, multiplier: 2.5 },
    MC: { name: "Monaco",            tier: 3, multiplier: 3.0 },
    AD: { name: "Andorra",           tier: 3, multiplier: 3.0 },
    SM: { name: "San Marino",        tier: 3, multiplier: 3.0 },
    VA: { name: "Vatican City",      tier: 3, multiplier: 3.0 },
};

// Unknown country → Tier 2 pricing (never give Tier 0 base to unknown IPs)
export const DEFAULT_TIER: TierLevel = 2;
export const DEFAULT_MULTIPLIER = 2.5;

/**
 * Absolute prices per plan per geo tier.
 * These are the final display prices — no multiplier math needed on the frontend.
 *
 * Stripe fee (2.9% + $0.30) already factored into Tier 2 & 3.
 * Tier 0 uses local EVC gateway (no Stripe fee).
 * Tier 1 mixed — fee absorbed.
 */
export const TIER_PRICES = {
    //               tier0     tier1     tier2     tier3
    //               Somalia   Africa    Gulf/ME   Western
    //               (EVC)     (mixed)   (+fee)    (+fee)
    //
    // Tier 0/1: EVC/local gateway — no Stripe fee, clean price
    // Tier 2/3: Stripe fee (2.9% + $0.30) added so YOU net the target
    starter: {
        monthly: [   0.50,     1,        1.50,     2     ],
        yearly:  [   0.50,     1,        1.50,     2     ],
    },
    basic: {
        monthly: [   1,        2,        3,        4     ],
        yearly:  [   9,       17,       26,       36     ],
    },
    pro: {
        monthly: [   2.50,     4,        6,        8     ],
        yearly:  [  20,       35,       52,       72     ],
    },
    elite: {
        monthly: [   3.50,     6,        9,       12     ],
        yearly:  [  30,       50,       80,      100     ],
    },
} as const;

export type NewPlanId = "starter" | "basic" | "pro" | "elite";
export type BillingCycle = "monthly" | "yearly";

/** Returns the price for a given plan, billing cycle, and geo tier */
export function getTierPrice(
    plan: NewPlanId,
    cycle: BillingCycle,
    tier: TierLevel
): number {
    return TIER_PRICES[plan][cycle][tier];
}

/** Returns effective per-month cost for yearly plan */
export function getYearlyMonthlyEquivalent(plan: NewPlanId, tier: TierLevel): number {
    return Math.round((TIER_PRICES[plan].yearly[tier] / 12) * 100) / 100;
}

/** Returns yearly discount % vs paying monthly x12 */
export function getYearlySavingPercent(plan: NewPlanId, tier: TierLevel): number {
    const monthly12 = TIER_PRICES[plan].monthly[tier] * 12;
    const yearly = TIER_PRICES[plan].yearly[tier];
    return Math.round((1 - yearly / monthly12) * 100);
}

/** Returns geo tier level for a country code */
export function getGeoTierLevel(countryCode: string | null | undefined): TierLevel {
    if (!countryCode) return DEFAULT_TIER;
    return GEO_TIERS[countryCode.toUpperCase()]?.tier ?? DEFAULT_TIER;
}

/** Whether this tier qualifies for a $1 / 3-day card trial */
export function isTierTrialEligible(tier: TierLevel): boolean {
    return tier >= 2;
}

// ── Legacy exports (keep existing checkout routes working) ────────────────

export function getGeoMultiplier(countryCode: string | null | undefined): number {
    if (!countryCode) return DEFAULT_MULTIPLIER;
    return GEO_TIERS[countryCode.toUpperCase()]?.multiplier ?? DEFAULT_MULTIPLIER;
}

export function getGeoCountryName(countryCode: string | null | undefined): string | null {
    if (!countryCode) return null;
    return GEO_TIERS[countryCode.toUpperCase()]?.name ?? null;
}
