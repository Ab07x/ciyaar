import { NextRequest, NextResponse } from "next/server";
import { getRequestGeo } from "@/lib/geo-lookup";
import {
    getGeoTierLevel,
    getTierPrice,
    getYearlyMonthlyEquivalent,
    getYearlySavingPercent,
    isTierTrialEligible,
    TIER_PRICES,
    type NewPlanId,
    type TierLevel,
} from "@/lib/geo-pricing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const { country, multiplier } = await getRequestGeo(request);
    const tier: TierLevel = getGeoTierLevel(country);
    const trialEligible = isTierTrialEligible(tier);

    const plans = (Object.keys(TIER_PRICES) as NewPlanId[]).map((planId) => ({
        id: planId,
        monthly: {
            price: getTierPrice(planId, "monthly", tier),
            label: `$${getTierPrice(planId, "monthly", tier).toFixed(2)}/mo`,
        },
        yearly: {
            price: getTierPrice(planId, "yearly", tier),
            label: `$${getTierPrice(planId, "yearly", tier).toFixed(2)}/yr`,
            perMonth: getYearlyMonthlyEquivalent(planId, tier),
            savePercent: getYearlySavingPercent(planId, tier),
        },
        trialEligible,
        trialDays: trialEligible ? 3 : 0,
        trialPrice: trialEligible ? 1.00 : 0,
    }));

    return NextResponse.json(
        { tier, country: country ?? null, multiplier, trialEligible, plans },
        { headers: { "Cache-Control": "no-store" } }
    );
}
