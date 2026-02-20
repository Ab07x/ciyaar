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
    { id: "yearly", label: "Yearly", subtitle: "Qiimo jaban sanadkii", duration: "365 maalmood", priceKey: "priceYearly", defaultPrice: 11.99 },
    { id: "weekly", label: "Weekly", subtitle: "Tijaabo degdeg ah", duration: "7 maalmood", priceKey: "priceWeekly", defaultPrice: 1.0 },
    { id: "match", label: "Single Match", subtitle: "Ciyaar keliya", duration: "1 ciyaar", priceKey: "priceMatch", defaultPrice: 0.2 },
];

export const PLAN_CARDS = [
    {
        id: "match" as PlanId,
        displayName: "Starter",
        durationLabel: "Single Match",
        bonusText: null,
        image: "/planimg/starter.png",
        nameColor: "text-blue-400",
        borderColor: "border-blue-400",
        btnColor: "bg-blue-500 hover:bg-blue-400",
        devices: 1,
        features: ["Single Match", "HD Quality"],
    },
    {
        id: "weekly" as PlanId,
        displayName: "Plus",
        durationLabel: "7-Day Plan",
        bonusText: null,
        image: "/planimg/plus.jpg",
        nameColor: "text-purple-400",
        borderColor: "border-purple-400",
        btnColor: "bg-purple-500 hover:bg-purple-400",
        devices: 2,
        features: ["Unlimited Watching", "Full-Term Payment"],
    },
    {
        id: "monthly" as PlanId,
        displayName: "Pro",
        durationLabel: "30-Day Plan",
        bonusText: null,
        image: "/planimg/pro.png",
        nameColor: "text-green-400",
        borderColor: "border-green-400",
        btnColor: "bg-green-500 hover:bg-green-400",
        devices: 3,
        features: ["Unlimited Watching", "Full-Term Payment"],
    },
    {
        id: "yearly" as PlanId,
        displayName: "Elite",
        durationLabel: "365-Day Plan",
        bonusText: "+2 months free",
        image: "/planimg/elite.jpg",
        nameColor: "text-yellow-400",
        borderColor: "border-yellow-400",
        btnColor: "bg-yellow-500 hover:bg-yellow-400",
        devices: 5,
        features: ["Unlimited Watching", "Full-Term Payment"],
    },
];

export function getPlanPrice(settings: any, plan: PlanOption): number {
    const raw = Number(settings?.[plan.priceKey]);
    if (Number.isFinite(raw) && raw > 0) return raw;
    return plan.defaultPrice;
}
