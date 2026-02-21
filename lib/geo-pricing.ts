/**
 * Geo-based pricing tiers.
 * Tier 0 — Somalia / Djibouti (base price ~$3.20/mo)
 * Tier 1 — East Africa / low-income (~$4.80–5.75/mo)
 * Tier 2 — Middle East / Gulf / diaspora hubs (~$8.00/mo)
 * Tier 3 — Western / high-income / diaspora (USA, EU, AU) (~$9.60/mo)
 * DEFAULT — Any country not listed → Tier 2 price (never Somali base)
 */

export type GeoTier = {
    name: string;
    multiplier: number;
};

// Country code → tier config
export const GEO_TIERS: Record<string, GeoTier> = {
    // ── Tier 0 — base (Somalia & Djibouti only) ──
    SO: { name: "Somalia", multiplier: 1.0 },
    DJ: { name: "Djibouti", multiplier: 1.0 },

    // ── Tier 1 — Africa / South Asia (low-income) ──
    KE: { name: "Kenya", multiplier: 1.8 },
    ET: { name: "Ethiopia", multiplier: 1.5 },
    UG: { name: "Uganda", multiplier: 1.5 },
    TZ: { name: "Tanzania", multiplier: 1.5 },
    ER: { name: "Eritrea", multiplier: 1.3 },
    SD: { name: "Sudan", multiplier: 1.3 },
    SS: { name: "South Sudan", multiplier: 1.3 },
    RW: { name: "Rwanda", multiplier: 1.5 },
    BI: { name: "Burundi", multiplier: 1.3 },
    MG: { name: "Madagascar", multiplier: 1.3 },
    MZ: { name: "Mozambique", multiplier: 1.3 },
    ZW: { name: "Zimbabwe", multiplier: 1.5 },
    ZM: { name: "Zambia", multiplier: 1.5 },
    MW: { name: "Malawi", multiplier: 1.3 },
    CM: { name: "Cameroon", multiplier: 1.5 },
    GH: { name: "Ghana", multiplier: 1.8 },
    NG: { name: "Nigeria", multiplier: 1.8 },
    SN: { name: "Senegal", multiplier: 1.5 },
    CI: { name: "Côte d'Ivoire", multiplier: 1.5 },
    ML: { name: "Mali", multiplier: 1.5 },
    ZA: { name: "South Africa", multiplier: 2.0 },
    CD: { name: "Congo - Kinshasa", multiplier: 1.5 },
    AO: { name: "Angola", multiplier: 1.5 },
    GN: { name: "Guinea", multiplier: 1.5 },
    MR: { name: "Mauritania", multiplier: 1.5 },
    SZ: { name: "Eswatini", multiplier: 1.5 },
    GQ: { name: "Equatorial Guinea", multiplier: 1.5 },
    IN: { name: "India", multiplier: 1.8 },
    PK: { name: "Pakistan", multiplier: 1.5 },
    BD: { name: "Bangladesh", multiplier: 1.5 },
    NP: { name: "Nepal", multiplier: 1.3 },
    PH: { name: "Philippines", multiplier: 1.8 },
    ID: { name: "Indonesia", multiplier: 1.8 },

    // ── Tier 2 — Middle East / Gulf / diaspora hubs ──
    AE: { name: "UAE", multiplier: 2.5 },
    SA: { name: "Saudi Arabia", multiplier: 2.5 },
    QA: { name: "Qatar", multiplier: 2.5 },
    KW: { name: "Kuwait", multiplier: 2.5 },
    BH: { name: "Bahrain", multiplier: 2.5 },
    OM: { name: "Oman", multiplier: 2.5 },
    YE: { name: "Yemen", multiplier: 1.5 },
    IR: { name: "Iran", multiplier: 2.0 },
    JO: { name: "Jordan", multiplier: 2.0 },
    LB: { name: "Lebanon", multiplier: 2.0 },
    IQ: { name: "Iraq", multiplier: 2.0 },
    EG: { name: "Egypt", multiplier: 1.8 },
    MA: { name: "Morocco", multiplier: 2.0 },
    DZ: { name: "Algeria", multiplier: 2.0 },
    TN: { name: "Tunisia", multiplier: 2.0 },
    LY: { name: "Libya", multiplier: 2.0 },
    TR: { name: "Turkey", multiplier: 2.0 },
    LK: { name: "Sri Lanka", multiplier: 2.0 },
    VN: { name: "Vietnam", multiplier: 2.0 },
    MY: { name: "Malaysia", multiplier: 2.5 },
    SG: { name: "Singapore", multiplier: 3.0 },
    TH: { name: "Thailand", multiplier: 2.0 },
    HK: { name: "Hong Kong", multiplier: 3.0 },
    JP: { name: "Japan", multiplier: 3.0 },
    KR: { name: "South Korea", multiplier: 3.0 },
    CN: { name: "China", multiplier: 2.5 },
    TW: { name: "Taiwan", multiplier: 2.5 },
    MX: { name: "Mexico", multiplier: 2.0 },
    BR: { name: "Brazil", multiplier: 2.0 },
    AR: { name: "Argentina", multiplier: 2.0 },
    CL: { name: "Chile", multiplier: 2.0 },
    CO: { name: "Colombia", multiplier: 2.0 },
    PE: { name: "Peru", multiplier: 2.0 },
    RU: { name: "Russia", multiplier: 2.0 },
    BY: { name: "Belarus", multiplier: 2.0 },
    KZ: { name: "Kazakhstan", multiplier: 2.0 },
    KG: { name: "Kyrgyzstan", multiplier: 2.0 },
    UZ: { name: "Uzbekistan", multiplier: 2.0 },
    AZ: { name: "Azerbaijan", multiplier: 2.0 },
    GE: { name: "Georgia", multiplier: 2.0 },
    AM: { name: "Armenia", multiplier: 2.0 },
    AF: { name: "Afghanistan", multiplier: 1.8 },
    MM: { name: "Myanmar", multiplier: 1.8 },
    BT: { name: "Bhutan", multiplier: 1.8 },
    LA: { name: "Laos", multiplier: 1.8 },
    KH: { name: "Cambodia", multiplier: 1.8 },
    VE: { name: "Venezuela", multiplier: 2.0 },
    YT: { name: "Mayotte", multiplier: 2.0 },
    RE: { name: "Réunion", multiplier: 2.0 },

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
    FR: { name: "France", multiplier: 3.0 },
    IT: { name: "Italy", multiplier: 2.5 },
    ES: { name: "Spain", multiplier: 2.5 },
    PT: { name: "Portugal", multiplier: 2.5 },
    PL: { name: "Poland", multiplier: 2.5 },
    CH: { name: "Switzerland", multiplier: 3.0 },
    AT: { name: "Austria", multiplier: 3.0 },
    BE: { name: "Belgium", multiplier: 3.0 },
    LU: { name: "Luxembourg", multiplier: 3.0 },
    AU: { name: "Australia", multiplier: 3.0 },
    NZ: { name: "New Zealand", multiplier: 3.0 },
    IE: { name: "Ireland", multiplier: 3.0 },
    IS: { name: "Iceland", multiplier: 3.0 },
    GR: { name: "Greece", multiplier: 2.5 },
    CZ: { name: "Czech Republic", multiplier: 2.5 },
    HU: { name: "Hungary", multiplier: 2.5 },
    SK: { name: "Slovakia", multiplier: 2.5 },
    RO: { name: "Romania", multiplier: 2.0 },
    BG: { name: "Bulgaria", multiplier: 2.0 },
    HR: { name: "Croatia", multiplier: 2.5 },
    RS: { name: "Serbia", multiplier: 2.0 },
    UA: { name: "Ukraine", multiplier: 2.0 },
    AL: { name: "Albania", multiplier: 2.0 },
    SI: { name: "Slovenia", multiplier: 2.5 },
    LV: { name: "Latvia", multiplier: 2.5 },
    IL: { name: "Israel", multiplier: 3.0 },
    LI: { name: "Liechtenstein", multiplier: 3.0 },
    CY: { name: "Cyprus", multiplier: 2.5 },
    MT: { name: "Malta", multiplier: 2.5 },
    MC: { name: "Monaco", multiplier: 3.0 },
    AD: { name: "Andorra", multiplier: 3.0 },
    SM: { name: "San Marino", multiplier: 3.0 },
    VA: { name: "Vatican City", multiplier: 3.0 },
};

// Any country NOT explicitly listed above → Tier 2 price (never give Somali base to unknown IPs)
export const DEFAULT_MULTIPLIER = 2.5;

export function getGeoMultiplier(countryCode: string | null | undefined): number {
    // null/undefined means geo lookup failed → use DEFAULT (never show Somali base price)
    if (!countryCode) return DEFAULT_MULTIPLIER;
    const upper = countryCode.toUpperCase();
    return GEO_TIERS[upper]?.multiplier ?? DEFAULT_MULTIPLIER;
}

export function getGeoCountryName(countryCode: string | null | undefined): string | null {
    if (!countryCode) return null;
    return GEO_TIERS[countryCode.toUpperCase()]?.name ?? null;
}
