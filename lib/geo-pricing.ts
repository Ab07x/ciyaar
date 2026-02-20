/**
 * Geo-based pricing tiers.
 * Tier 0 — Somalia / Djibouti (base price)
 * Tier 1 — East Africa neighbours
 * Tier 2 — Middle East / North Africa / diaspora hubs
 * Tier 3 — Western / high-income countries (USA, Canada, Europe, Nordics, AU)
 */

export type GeoTier = {
    name: string;
    multiplier: number;
};

// Country code → tier config
export const GEO_TIERS: Record<string, GeoTier> = {
    // ── Tier 0 — base (Somalia & Djibouti) ──
    SO: { name: "Somalia", multiplier: 1.0 },
    DJ: { name: "Djibouti", multiplier: 1.0 },

    // ── Tier 1 — East / Horn of Africa ──
    KE: { name: "Kenya", multiplier: 1.8 },
    ET: { name: "Ethiopia", multiplier: 1.5 },
    UG: { name: "Uganda", multiplier: 1.5 },
    TZ: { name: "Tanzania", multiplier: 1.5 },
    ER: { name: "Eritrea", multiplier: 1.3 },
    SD: { name: "Sudan", multiplier: 1.3 },

    // ── Tier 2 — Middle East / North Africa / Gulf (diaspora) ──
    AE: { name: "UAE", multiplier: 2.5 },
    SA: { name: "Saudi Arabia", multiplier: 2.5 },
    QA: { name: "Qatar", multiplier: 2.5 },
    KW: { name: "Kuwait", multiplier: 2.5 },
    BH: { name: "Bahrain", multiplier: 2.5 },
    OM: { name: "Oman", multiplier: 2.0 },
    EG: { name: "Egypt", multiplier: 1.5 },
    TR: { name: "Turkey", multiplier: 2.0 },
    MY: { name: "Malaysia", multiplier: 2.0 },

    // ── Tier 3 — Western / high-income (largest diaspora) ──
    US: { name: "USA", multiplier: 3.0 },
    CA: { name: "Canada", multiplier: 3.0 },
    GB: { name: "United Kingdom", multiplier: 3.0 },
    SE: { name: "Sweden", multiplier: 3.0 },
    NO: { name: "Norway", multiplier: 3.0 },
    DK: { name: "Denmark", multiplier: 3.0 },
    FI: { name: "Finland", multiplier: 3.0 },
    DE: { name: "Germany", multiplier: 3.0 },
    NL: { name: "Netherlands", multiplier: 3.0 },
    FR: { name: "France", multiplier: 2.5 },
    IT: { name: "Italy", multiplier: 2.5 },
    CH: { name: "Switzerland", multiplier: 3.0 },
    AT: { name: "Austria", multiplier: 2.5 },
    BE: { name: "Belgium", multiplier: 2.5 },
    AU: { name: "Australia", multiplier: 3.0 },
    NZ: { name: "New Zealand", multiplier: 3.0 },
    IE: { name: "Ireland", multiplier: 3.0 },
};

// Fallback for countries not listed above
export const DEFAULT_MULTIPLIER = 1.5;

export function getGeoMultiplier(countryCode: string | null | undefined): number {
    if (!countryCode) return 1.0;
    const upper = countryCode.toUpperCase();
    return GEO_TIERS[upper]?.multiplier ?? DEFAULT_MULTIPLIER;
}

export function getGeoCountryName(countryCode: string | null | undefined): string | null {
    if (!countryCode) return null;
    return GEO_TIERS[countryCode.toUpperCase()]?.name ?? null;
}
