import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { DiscountCode } from "@/lib/models";

// Plan prices must match PLAN_DISPLAY in pay/page.tsx
const PLAN_PRICES: Record<string, number> = {
    match: 1.50,
    weekly: 3.00,
    monthly: 6.00,
    yearly: 80.00,
};

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const { code, plan } = await request.json();

        if (!code || !plan) {
            return NextResponse.json({ valid: false, message: "Code and plan are required" }, { status: 400 });
        }

        const discount = await DiscountCode.findOne({ code: code.toUpperCase() });

        if (!discount) {
            return NextResponse.json({ valid: false, message: "Invalid discount code" });
        }

        if (!discount.isActive) {
            return NextResponse.json({ valid: false, message: "This discount code is no longer active" });
        }

        if (discount.expiresAt && discount.expiresAt <= Date.now()) {
            return NextResponse.json({ valid: false, message: "This discount code has expired" });
        }

        if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
            return NextResponse.json({ valid: false, message: "This discount code has reached its usage limit" });
        }

        if (discount.applicablePlans.length > 0 && !discount.applicablePlans.includes(plan)) {
            return NextResponse.json({ valid: false, message: "This discount code does not apply to the selected plan" });
        }

        const originalPrice = PLAN_PRICES[plan];
        if (!originalPrice) {
            return NextResponse.json({ valid: false, message: "Invalid plan" });
        }

        let discountAmount: number;
        if (discount.discountType === "percentage") {
            discountAmount = Math.round(originalPrice * (discount.discountValue / 100) * 100) / 100;
        } else {
            discountAmount = Math.min(discount.discountValue, originalPrice);
        }

        // Floor: never go below $0.50
        const finalPrice = Math.max(0.50, Math.round((originalPrice - discountAmount) * 100) / 100);
        const actualDiscount = Math.round((originalPrice - finalPrice) * 100) / 100;

        return NextResponse.json({
            valid: true,
            discountType: discount.discountType,
            discountValue: discount.discountValue,
            originalPrice,
            discountAmount: actualDiscount,
            finalPrice,
            message: discount.discountType === "percentage"
                ? `${discount.discountValue}% off applied!`
                : `$${actualDiscount.toFixed(2)} off applied!`,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Validation failed";
        return NextResponse.json({ valid: false, message }, { status: 500 });
    }
}
