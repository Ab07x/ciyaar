import mongoose, { Schema, Document } from "mongoose";

// USER
export interface IUser extends Document {
    phoneOrId?: string;
    username?: string;
    usernameLower?: string;
    displayName?: string;
    avatarUrl?: string;
    trialExpiresAt?: number;
    isTrialUsed?: boolean;
    lastFreeMovieWatchedAt?: number;
    freeMovieWatchedThisWeek?: string;
    referralCode?: string;
    referredBy?: string;
    referralCount?: number;
    referralEarnings?: number;
    isReferralCredited?: boolean;
    createdAt: number;
}

const UserSchema = new Schema<IUser>(
    {
        phoneOrId: String,
        username: { type: String, index: true },
        usernameLower: { type: String, unique: true, sparse: true, index: true },
        displayName: String,
        avatarUrl: String,
        trialExpiresAt: Number,
        isTrialUsed: Boolean,
        lastFreeMovieWatchedAt: Number,
        freeMovieWatchedThisWeek: String,
        referralCode: { type: String, index: true },
        referredBy: String,
        referralCount: Number,
        referralEarnings: Number,
        isReferralCredited: Boolean,
        createdAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema, "users");

// DEVICE
export interface IDevice extends Document {
    userId: string;
    deviceId: string;
    userAgent?: string;
    lastSeenAt: number;
}

const DeviceSchema = new Schema<IDevice>(
    {
        userId: { type: String, required: true, index: true },
        deviceId: { type: String, required: true, index: true },
        userAgent: String,
        lastSeenAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Device = mongoose.models.Device || mongoose.model<IDevice>("Device", DeviceSchema, "devices");

// SUBSCRIPTION
export interface ISubscription extends Document {
    userId: string;
    plan: "match" | "weekly" | "monthly" | "yearly";
    matchId?: string;
    expiresAt: number;
    maxDevices: number;
    status: "active" | "expired" | "revoked";
    codeId?: string;
    createdAt: number;
}

const SubscriptionSchema = new Schema<ISubscription>(
    {
        userId: { type: String, required: true, index: true },
        plan: { type: String, enum: ["match", "weekly", "monthly", "yearly"], required: true },
        matchId: String,
        expiresAt: { type: Number, required: true },
        maxDevices: { type: Number, required: true },
        status: { type: String, enum: ["active", "expired", "revoked"], required: true, index: true },
        codeId: String,
        createdAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema, "subscriptions");

// REDEMPTION
export interface IRedemption extends Document {
    code: string;
    plan: "match" | "weekly" | "monthly" | "yearly";
    durationDays: number;
    maxDevices: number;
    source?: "manual" | "auto_payment" | "whatsapp";
    paymentOrderId?: string;
    note?: string;
    expiresAt?: number;
    usedByUserId?: string;
    usedAt?: number;
    revokedAt?: number;
    createdAt: number;
}

const RedemptionSchema = new Schema<IRedemption>(
    {
        code: { type: String, required: true, index: true },
        plan: { type: String, enum: ["match", "weekly", "monthly", "yearly"], required: true },
        durationDays: { type: Number, required: true },
        maxDevices: { type: Number, required: true },
        source: { type: String, index: true },
        paymentOrderId: { type: String, index: true },
        note: String,
        expiresAt: Number,
        usedByUserId: String,
        usedAt: Number,
        revokedAt: Number,
        createdAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Redemption = mongoose.models.Redemption || mongoose.model<IRedemption>("Redemption", RedemptionSchema, "redemptions");
