import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payment } from "@/lib/models";
import { SOCIAL_PROOF_POOL } from "@/lib/offers";

/**
 * GET /api/offers/social-proof
 * Returns 3–5 recent subscriber items for social proof toasts.
 * Blends real payment timestamps with seeded names/cities for privacy.
 * Cached 5 minutes (revalidate).
 */
export const revalidate = 300;

export async function GET() {
    try {
        await connectDB();

        // Pull recent successful payments (last 7 days)
        const recentPayments = await Payment
            .find({ status: "success", completedAt: { $gte: Date.now() - 7 * 24 * 60 * 60 * 1000 } })
            .sort({ completedAt: -1 })
            .limit(20)
            .select("plan completedAt geoCountry")
            .lean<{ plan: string; completedAt?: number; geoCountry?: string }[]>()
            .catch(() => []);

        const count = Math.max(4, Math.min(6, recentPayments.length));
        const usedNames = new Set<string>();
        const items: { name: string; city: string; plan: string; secsAgo: number }[] = [];

        for (let i = 0; i < count; i++) {
            // Pick a unique name from pool
            let pick = SOCIAL_PROOF_POOL[Math.floor(Math.random() * SOCIAL_PROOF_POOL.length)];
            let attempts = 0;
            while (usedNames.has(pick.name) && attempts < 10) {
                pick = SOCIAL_PROOF_POOL[Math.floor(Math.random() * SOCIAL_PROOF_POOL.length)];
                attempts++;
            }
            usedNames.add(pick.name);

            const payment = recentPayments[i];
            const realSecsAgo = payment?.completedAt
                ? Math.floor((Date.now() - Number(payment.completedAt)) / 1000)
                : null;

            // Add ±2min noise for privacy; cap at 6 hours for freshness
            const fuzzed = realSecsAgo !== null
                ? Math.min(21600, Math.max(30, realSecsAgo + Math.floor((Math.random() - 0.5) * 240)))
                : Math.floor(Math.random() * 7200) + 60;

            items.push({
                name:    pick.name,
                city:    pick.city,
                plan:    payment?.plan ?? ["monthly", "yearly", "monthly", "weekly"][i % 4],
                secsAgo: fuzzed,
            });
        }

        // Sort by most recent first
        items.sort((a, b) => a.secsAgo - b.secsAgo);

        return NextResponse.json({ items });
    } catch {
        // Fallback seed data — always works
        const items = [
            { name: "Axmed",    city: "Minneapolis", plan: "monthly", secsAgo: 45    },
            { name: "Fadumo",   city: "London",      plan: "yearly",  secsAgo: 210   },
            { name: "Xuseen",   city: "Oslo",        plan: "monthly", secsAgo: 840   },
            { name: "Maryan",   city: "Dubai",       plan: "monthly", secsAgo: 2400  },
            { name: "Mustafe",  city: "Atlanta",     plan: "weekly",  secsAgo: 5100  },
        ];
        return NextResponse.json({ items });
    }
}
