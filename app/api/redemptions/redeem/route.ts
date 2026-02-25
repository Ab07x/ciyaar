import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { Redemption, Subscription, User, Device, UserMovieTrial } from "@/lib/models";
import { generateUniqueReferralCode } from "@/lib/referral-code";
import { buildTrialAliasSet, resolveTrialMovie } from "@/lib/trial-movie";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/redemptions/redeem — redeem a code
export async function POST(req: NextRequest) {
    try {
        // ── Rate limiting: max 10 attempts per IP per hour ──────────────
        const ip = getClientIp(req);
        const rl = checkRateLimit(`redeem:${ip}`, 10, 60 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: "Too many attempts. Please try again later." },
                { status: 429 }
            );
        }

        await connectDB();
        const { code, deviceId } = await req.json();

        if (!code || !deviceId) {
            return NextResponse.json({ error: "code and deviceId required" }, { status: 400 });
        }

        // Find the code
        const redemption = await Redemption.findOne({ code: code.toUpperCase(), revokedAt: null });
        if (!redemption) {
            return NextResponse.json({ error: "Invalid or revoked code" }, { status: 404 });
        }

        // Check if already used
        if (redemption.usedByUserId) {
            return NextResponse.json({ error: "Code already used" }, { status: 400 });
        }

        // Check if expired
        if (redemption.expiresAt && redemption.expiresAt < Date.now()) {
            return NextResponse.json({ error: "Code expired" }, { status: 400 });
        }

        // ── Trial abuse prevention: one trial per device ─────────────────
        const trialHoursCheck = Number((redemption as { trialHours?: number }).trialHours || 0);
        if (trialHoursCheck > 0) {
            // Check if this device already used a trial
            const existingDevice = await Device.findOne({ deviceId });
            if (existingDevice?.userId) {
                const alreadyUsedTrial = await UserMovieTrial.exists({
                    userId: existingDevice.userId,
                });
                if (alreadyUsedTrial) {
                    return NextResponse.json(
                        { error: "Trial already used on this device." },
                        { status: 400 }
                    );
                }
            }
        }

        // Find or create user
        let device = await Device.findOne({ deviceId });
        let user = null;

        if (device && mongoose.Types.ObjectId.isValid(device.userId)) {
            user = await User.findById(device.userId);
        }

        const now = Date.now();

        if (!user) {
            // Create new user
            user = await User.create({
                createdAt: now,
                referralCode: await generateUniqueReferralCode(),
                referralCount: 0,
            });

            // If there is a stale device row, re-bind it to the new user.
            if (device) {
                device.userId = user._id.toString();
                device.lastSeenAt = now;
                await device.save();
            } else {
                device = await Device.create({
                    userId: user._id.toString(),
                    deviceId,
                    lastSeenAt: now,
                });
            }
        } else if (device) {
            // Keep device-user mapping fresh for valid returning users.
            if (device.userId !== user._id.toString()) {
                device.userId = user._id.toString();
            }
            device.lastSeenAt = now;
            await device.save();
        }

        // Mark code as used
        redemption.usedByUserId = user._id.toString();
        redemption.usedAt = now;
        await redemption.save();

        const trialHours = Number((redemption as { trialHours?: number }).trialHours || 0);
        const trialMovieIdRaw = String((redemption as { trialMovieId?: string }).trialMovieId || "").trim();
        const trialMovieTitle = String((redemption as { trialMovieTitle?: string }).trialMovieTitle || "").trim();

        // Movie trial codes grant single-movie access for limited hours (no full premium subscription).
        if (trialHours > 0 && trialMovieIdRaw) {
            const resolvedTrialMovie = await resolveTrialMovie(trialMovieIdRaw);
            const trialMovieId = resolvedTrialMovie.canonicalMovieId || trialMovieIdRaw;
            const trialMovieAliases = new Set<string>(resolvedTrialMovie.aliases);
            buildTrialAliasSet(trialMovieTitle).forEach((alias) => trialMovieAliases.add(alias));

            const trialExpiresAt = now + trialHours * 60 * 60 * 1000;
            await UserMovieTrial.create({
                userId: user._id.toString(),
                movieId: trialMovieId,
                movieAliases: Array.from(trialMovieAliases),
                codeId: redemption._id.toString(),
                code: redemption.code,
                trialHours,
                grantedAt: now,
                expiresAt: trialExpiresAt,
            });

            return NextResponse.json({
                success: true,
                trial: true,
                trialHours,
                trialMovieId,
                expiresAt: trialExpiresAt,
                message: `Trial la furay: ${trialHours} saac oo filimkan ah (${trialMovieId}).`,
            });
        }

        // Create subscription
        const expiresAt = now + redemption.durationDays * 24 * 60 * 60 * 1000;
        const subscription = await Subscription.create({
            userId: user._id.toString(),
            plan: redemption.plan,
            expiresAt,
            maxDevices: redemption.maxDevices,
            status: "active",
            codeId: redemption._id.toString(),
            createdAt: now,
        });

        return NextResponse.json({
            success: true,
            subscription,
            plan: redemption.plan,
            durationDays: redemption.durationDays,
            expiresAt,
        });
    } catch (error) {
        console.error("POST /api/redemptions/redeem error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
