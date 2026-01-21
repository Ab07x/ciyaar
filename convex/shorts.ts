import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        // Return published shorts, sorted by creation time (descending)
        // Note: We don't have a specific index for "published + desc creation" efficiently without combined index
        // But for < 100 items, filtering is fine.
        // For now, use the 'by_published' index.
        const shorts = await ctx.db
            .query("shorts")
            .withIndex("by_published", (q) => q.eq("isPublished", true))
            .order("desc")
            .take(args.limit || 20);

        return shorts;
    },
});

export const seedDefaults = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("shorts").first();
        if (existing) return "Already seeded";

        const defaults = [
            {
                title: "GOOLKA CAAWA: Liverpool 2-1 Chelsea",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0",
                thumbnailUrl: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=400",
                views: 125000,
                isLive: false,
                channelName: "Astaan Sports",
                createdAt: Date.now(),
                isPublished: true,
            },
            {
                title: "Dabcasar oo ka hadlay guuldarada Arsenal",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0",
                thumbnailUrl: "https://images.unsplash.com/photo-1579952363873-27f3bde9be51?auto=format&fit=crop&q=80&w=400",
                views: 45000,
                isLive: true,
                channelName: "Dabcasar TV",
                createdAt: Date.now() - 10000,
                isPublished: true,
            },
            {
                title: "Messi vs Ronaldo: Skills 2024",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0",
                thumbnailUrl: "https://images.unsplash.com/photo-1543326727-b56819ddcd82?auto=format&fit=crop&q=80&w=400",
                views: 89000,
                isLive: false,
                channelName: "Gool FM",
                createdAt: Date.now() - 20000,
                isPublished: true,
            },
            {
                title: "Ciyaarta Berri: Real Madrid vs Barca",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0",
                thumbnailUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=400",
                views: 210000,
                isLive: false,
                channelName: "La Liga",
                createdAt: Date.now() - 30000,
                isPublished: true,
            },
            {
                title: "Qosolka Adduunka: Taageeraha Manchester",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0",
                thumbnailUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=400",
                views: 12000,
                isLive: false,
                channelName: "Somali Memes",
                createdAt: Date.now() - 40000,
                isPublished: true,
            }
        ];

        for (const s of defaults) {
            await ctx.db.insert("shorts", s);
        }
        return "Seeded shorts";
    }
});
