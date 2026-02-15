import crypto from "crypto";
import { User } from "@/lib/models";

export function generateReferralCodeCandidate(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
}

export async function generateUniqueReferralCode(maxAttempts = 12): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
        const candidate = generateReferralCodeCandidate();
        const exists = await User.exists({ referralCode: candidate });
        if (!exists) return candidate;
    }

    const fallback = `${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8);
    return fallback.padEnd(8, "0");
}

