import mongoose, { Schema, Document } from "mongoose";

export interface IMatch extends Document {
    convexId?: string;
    slug: string;
    title: string;
    teamA: string;
    teamB: string;
    teamALogo?: string;
    teamBLogo?: string;
    articleTitle?: string;
    articleContent?: string;
    leagueId?: string;
    leagueName?: string;
    league?: string;
    kickoffAt: number;
    status: "upcoming" | "live" | "finished";
    isPremium: boolean;
    premiumPassword?: string | null;
    requiredPlan?: "match" | "weekly" | "monthly" | "yearly";
    embeds: { label: string; url: string; type?: string; isProtected?: boolean }[];
    thumbnailUrl?: string | null;
    summary?: string | null;
    scoreA?: number;
    scoreB?: number;
    minute?: number;
    goals?: { team: "A" | "B"; player: string; minute: number; type?: string }[];
    lineup?: {
        home: { formation: string; players: { number: number; name: string; position: { x: number; y: number } }[]; substitutes?: { number: number; name: string }[] };
        away: { formation: string; players: { number: number; name: string; position: { x: number; y: number } }[]; substitutes?: { number: number; name: string }[] };
    };
    views?: number;
    createdAt: number;
    updatedAt: number;
}

const MatchSchema = new Schema<IMatch>(
    {
        convexId: String,
        slug: { type: String, required: true, index: true },
        title: { type: String, required: true },
        teamA: { type: String, required: true },
        teamB: { type: String, required: true },
        teamALogo: String,
        teamBLogo: String,
        articleTitle: String,
        articleContent: String,
        leagueId: String,
        leagueName: String,
        league: String,
        kickoffAt: { type: Number, required: true, index: true },
        status: { type: String, enum: ["upcoming", "live", "finished"], required: true, index: true },
        isPremium: { type: Boolean, required: true },
        premiumPassword: Schema.Types.Mixed,
        requiredPlan: { type: String, enum: ["match", "weekly", "monthly", "yearly"] },
        embeds: [{ label: String, url: String, type: { type: String }, isProtected: Boolean }],
        thumbnailUrl: Schema.Types.Mixed,
        summary: Schema.Types.Mixed,
        scoreA: Number,
        scoreB: Number,
        minute: Number,
        goals: [{ team: String, player: String, minute: Number, type: { type: String } }],
        lineup: Schema.Types.Mixed,
        views: { type: Number, default: 0 },
        createdAt: { type: Number, required: true },
        updatedAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Match = mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema, "matches");
