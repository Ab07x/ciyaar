import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const seedDSTV = mutation({
    args: {},
    handler: async (ctx) => {
        const channels = [
            {
                name: "SS Premier League HD",
                slug: "ss-pl",
                category: "sports",
                streamUrl: "https://cd.fanbroj.net/hls/ss_pl/index.m3u8",
                thumbnailUrl: "https://images.tstatic.net/img/logo/dstv.png",
                isLive: true,
                isPremium: true,
                priority: 100,
            },
            {
                name: "SS Action HD",
                slug: "ss-action",
                category: "sports",
                streamUrl: "https://cd.fanbroj.net/hls/ss_action/index.m3u8",
                thumbnailUrl: "https://images.tstatic.net/img/logo/dstv.png",
                isLive: true,
                isPremium: true,
                priority: 99,
            },
            {
                name: "ESPN 2 HD",
                slug: "espn2",
                category: "sports",
                streamUrl: "https://cd.fanbroj.net/hls/espn2/index.m3u8",
                thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a3/ESPN2_logo.svg",
                isLive: true,
                isPremium: true,
                priority: 98,
            },
            {
                name: "Maximo 1 HD",
                slug: "maximo1",
                category: "sports",
                streamUrl: "https://cd.fanbroj.net/hls/maximo1/index.m3u8",
                thumbnailUrl: "https://images.tstatic.net/img/logo/dstv.png",
                isLive: true,
                isPremium: true,
                priority: 97,
            }
        ];

        for (const ch of channels) {
            const existing = await ctx.db
                .query("channels")
                .withIndex("by_slug", (q) => q.eq("slug", ch.slug))
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, {
                    embeds: [{ label: "Main", url: ch.streamUrl, type: "m3u8" }],
                    thumbnailUrl: ch.thumbnailUrl,
                    isLive: ch.isLive,
                    isPremium: ch.isPremium,
                    priority: ch.priority,
                    category: ch.category as "sports" | "entertainment" | "news" | "movies",
                });
            } else {
                await ctx.db.insert("channels", {
                    ...ch,
                    category: ch.category as "sports" | "entertainment" | "news" | "movies",
                    embeds: [{ label: "Main", url: ch.streamUrl, type: "m3u8" }],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }
    }
});
