import { Redemption } from "@/lib/models";

export type PremiumPlan = "match" | "weekly" | "monthly" | "yearly";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCandidateCode(length = 8): string {
    let code = "";
    for (let i = 0; i < length; i += 1) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}

export async function generateUniqueRedemptionCode(): Promise<string> {
    for (let i = 0; i < 32; i += 1) {
        const code = generateCandidateCode(8);
        const exists = await Redemption.exists({ code });
        if (!exists) return code;
    }
    return `FBJ${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

type AutoCodeInput = {
    paymentOrderId: string;
    userId: string;
    plan: PremiumPlan;
    durationDays: number;
    maxDevices: number;
    now?: number;
};

type AutoCodeResult = {
    code: string;
    redemptionId: string;
};

export async function getOrCreateAutoPaymentRedemption({
    paymentOrderId,
    userId,
    plan,
    durationDays,
    maxDevices,
    now = Date.now(),
}: AutoCodeInput): Promise<AutoCodeResult> {
    const existing = await Redemption.findOne({ paymentOrderId });
    if (existing) {
        let dirty = false;

        if (!existing.usedByUserId || existing.usedByUserId !== userId) {
            existing.usedByUserId = userId;
            dirty = true;
        }
        if (!existing.usedAt) {
            existing.usedAt = now;
            dirty = true;
        }
        if (!existing.source) {
            existing.source = "auto_payment";
            dirty = true;
        }

        if (dirty) {
            await existing.save();
        }

        return {
            code: existing.code,
            redemptionId: existing._id.toString(),
        };
    }

    const code = await generateUniqueRedemptionCode();
    const redemption = await Redemption.create({
        code,
        plan,
        durationDays,
        maxDevices,
        source: "auto_payment",
        paymentOrderId,
        usedByUserId: userId,
        usedAt: now,
        createdAt: now,
    });

    return {
        code: redemption.code,
        redemptionId: redemption._id.toString(),
    };
}
