// ── Legacy plan IDs (kept for existing checkout/webhook routes) ──────────────
export type PlanId = "match" | "weekly" | "monthly" | "yearly";

export type PlanOption = {
    id: PlanId;
    label: string;
    subtitle: string;
    duration: string;
    priceKey: "priceMatch" | "priceWeekly" | "priceMonthly" | "priceYearly";
    defaultPrice: number;
};

export const PLAN_OPTIONS: PlanOption[] = [
    { id: "monthly", label: "Monthly", subtitle: "Qorshaha ugu badan", duration: "30 maalmood", priceKey: "priceMonthly", defaultPrice: 3.2 },
    { id: "yearly",  label: "Yearly",  subtitle: "Qiimo jaban sanadkii", duration: "365 maalmood", priceKey: "priceYearly", defaultPrice: 11.99 },
    { id: "weekly",  label: "Weekly",  subtitle: "Tijaabo degdeg ah", duration: "7 maalmood", priceKey: "priceWeekly", defaultPrice: 1.0 },
    { id: "match",   label: "Single Match", subtitle: "Ciyaar keliya", duration: "1 ciyaar", priceKey: "priceMatch", defaultPrice: 0.2 },
];

export function getPlanPrice(settings: Record<string, unknown> | null | undefined, plan: PlanOption): number {
    const raw = Number(settings?.[plan.priceKey]);
    if (Number.isFinite(raw) && raw > 0) return raw;
    return plan.defaultPrice;
}

// ── New plan IDs (pricing page + new checkout flow) ──────────────────────────
export type NewPlanId = "starter" | "basic" | "pro" | "elite";
export type BillingCycle = "monthly" | "yearly";

export type NewPlanCard = {
    id: NewPlanId;
    /** Maps to legacy PlanId for existing checkout routes */
    legacyId: PlanId;
    displayName: string;
    tagline: string;
    badge: string | null;
    highlight: boolean;
    trialLabel: string | null;         // shown only for Tier 2/3
    durationDays: number;              // for monthly billing
    devices: number;
    quality: string;
    downloads: boolean;
    screens: string;
    features: string[];
    notIncluded: string[];
    nameColor: string;
    borderColor: string;
    btnClass: string;
    glowClass: string;
};

export const NEW_PLAN_CARDS: NewPlanCard[] = [
    {
        id: "starter",
        legacyId: "match",
        displayName: "Starter",
        tagline: "3-day access",
        badge: null,
        highlight: false,
        trialLabel: null,
        durationDays: 3,
        devices: 1,
        quality: "HD",
        downloads: false,
        screens: "1 screen",
        features: ["HD streaming", "Live sports", "1 device"],
        notIncluded: ["Offline downloads", "Multi-screen", "4K quality"],
        nameColor: "text-pink-400",
        borderColor: "border-pink-500/40",
        btnClass: "bg-pink-500 hover:bg-pink-400 text-white",
        glowClass: "",
    },
    {
        id: "basic",
        legacyId: "weekly",
        displayName: "Basic",
        tagline: "7-day access",
        badge: null,
        highlight: false,
        trialLabel: null,
        durationDays: 7,
        devices: 1,
        quality: "HD",
        downloads: false,
        screens: "1 screen",
        features: ["HD streaming", "Live sports", "1 device", "EVC + Card"],
        notIncluded: ["Offline downloads", "Multi-screen", "4K quality"],
        nameColor: "text-blue-400",
        borderColor: "border-blue-500/40",
        btnClass: "bg-blue-600 hover:bg-blue-500 text-white",
        glowClass: "",
    },
    {
        id: "pro",
        legacyId: "monthly",
        displayName: "Pro",
        tagline: "Most popular · 30-day access",
        badge: "MOST POPULAR",
        highlight: true,
        trialLabel: "3-day $1 trial",
        durationDays: 30,
        devices: 3,
        quality: "Full HD",
        downloads: true,
        screens: "3 screens",
        features: ["Full HD streaming", "Live sports HD", "3 devices", "Offline downloads", "EVC + Card", "WhatsApp support"],
        notIncluded: ["4K quality"],
        nameColor: "text-green-400",
        borderColor: "border-green-500/60",
        btnClass: "bg-green-500 hover:bg-green-400 text-black font-black",
        glowClass: "shadow-lg shadow-green-500/20",
    },
    {
        id: "elite",
        legacyId: "yearly",
        displayName: "Elite",
        tagline: "Best value · 365-day access",
        badge: "BEST VALUE",
        highlight: false,
        trialLabel: "3-day $1 trial",
        durationDays: 365,
        devices: 5,
        quality: "4K Ultra HD",
        downloads: true,
        screens: "5 screens",
        features: ["4K Ultra HD", "Live sports 4K", "5 devices", "Offline downloads", "EVC + Card", "Priority support", "+2 months free"],
        notIncluded: [],
        nameColor: "text-yellow-400",
        borderColor: "border-yellow-400/60",
        btnClass: "bg-yellow-400 hover:bg-yellow-300 text-black font-black",
        glowClass: "shadow-lg shadow-yellow-400/20",
    },
];

export const PLAN_DURATIONS: Record<string, number> = {
    match: 1,
    weekly: 7,
    monthly: 30,
    yearly: 365,
    starter: 3,
    basic: 7,
    pro: 30,
    elite: 365,
};

export const PLAN_DEVICES: Record<string, number> = {
    match: 1,
    weekly: 1,
    monthly: 3,
    yearly: 5,
    starter: 1,
    basic: 1,
    pro: 3,
    elite: 5,
};

/** Maps new plan ID → legacy plan ID for checkout compatibility */
export function toLegacyPlanId(newPlanId: NewPlanId): PlanId {
    const map: Record<NewPlanId, PlanId> = {
        starter: "match",
        basic: "weekly",
        pro: "monthly",
        elite: "yearly",
    };
    return map[newPlanId];
}
