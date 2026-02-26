import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import { Settings, Payment, ConversionEvent } from "@/lib/models";
import { getRequestGeo } from "@/lib/geo-lookup";

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { plan, deviceId, offerBonusDays, offerCode } = body;

        if (!plan || !deviceId) {
            return NextResponse.json(
                { error: "plan and deviceId are required" },
                { status: 400 }
            );
        }

        if (!["match", "weekly", "monthly", "yearly"].includes(plan)) {
            return NextResponse.json(
                { error: "Invalid plan" },
                { status: 400 }
            );
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: "Stripe not configured" },
                { status: 500 }
            );
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Get price from settings
        const settings = await Settings.findOne().lean<Record<string, unknown> | null>();
        const priceKey = `price${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
        const baseAmount = Number(settings?.[priceKey] || 0);
        const bonusDays = plan === "monthly" ? Math.min(7, Math.max(0, Number(offerBonusDays) || 0)) : 0;
        const normalizedOfferCode = bonusDays > 0 ? String(offerCode || "MONTHLY_EXIT_7D") : "";

        if (!baseAmount || baseAmount <= 0) {
            return NextResponse.json(
                { error: "Price not configured for this plan" },
                { status: 400 }
            );
        }

        // Apply geo-based pricing multiplier
        const { country, multiplier } = await getRequestGeo(request);
        const finalAmount = Math.round(baseAmount * multiplier * 100) / 100;

        // Generate unique order ID
        const orderNonce = crypto.randomBytes(4).toString("hex").toUpperCase();
        const orderId = `FBJ-STRIPE-${plan.toUpperCase()}-${Date.now()}-${orderNonce}`;

        // Get site URL
        const siteUrl = process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : (process.env.NEXT_PUBLIC_APP_URL || "https://fanproj.shop");

        const planLabels: Record<string, string> = {
            match: "Single Match",
            weekly: "Weekly (7 Days)",
            monthly: "Monthly (30 Days)",
            yearly: "Yearly (365 Days)",
        };

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Fanbroj Premium - ${planLabels[plan] || plan}`,
                            description: bonusDays > 0
                                ? `${planLabels[plan]} + ${bonusDays} bonus days`
                                : planLabels[plan] || plan,
                        },
                        unit_amount: Math.round(finalAmount * 100), // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            success_url: `${siteUrl}/pay?stripe_session={CHECKOUT_SESSION_ID}&order_id=${encodeURIComponent(orderId)}`,
            cancel_url: `${siteUrl}/pay?plan=${plan}`,
            metadata: {
                orderId,
                plan,
                deviceId,
                bonusDays: String(bonusDays),
                offerCode: normalizedOfferCode,
            },
        });

        if (!session.url) {
            return NextResponse.json(
                { error: "Failed to create checkout session" },
                { status: 500 }
            );
        }

        // Save pending payment record
        await Payment.create({
            deviceId,
            plan,
            amount: finalAmount,
            currency: "USD",
            orderId,
            gateway: "stripe",
            stripeSessionId: session.id,
            status: "pending",
            bonusDays,
            offerCode: normalizedOfferCode || undefined,
            verifyAttempts: 0,
            lastCheckedAt: 0,
            geoCountry: country || undefined,
            geoMultiplier: multiplier,
            baseAmount,
            createdAt: Date.now(),
        });

        try {
            await ConversionEvent.create({
                eventName: "purchase_started",
                deviceId,
                pageType: "pricing",
                plan,
                source: "stripe_checkout",
                metadata: {
                    baseAmount,
                    finalAmount,
                    geoCountry: country || undefined,
                    geoMultiplier: multiplier,
                    bonusDays,
                    offerCode: normalizedOfferCode || undefined,
                    orderId,
                    stripeSessionId: session.id,
                },
                date: new Date().toISOString().slice(0, 10),
                createdAt: Date.now(),
            });
        } catch (eventError) {
            console.error("Stripe checkout conversion event write failed:", eventError);
        }

        return NextResponse.json({
            checkoutUrl: session.url,
            orderId,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to initiate Stripe checkout";
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
