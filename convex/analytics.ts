import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Generic increment for any table with a 'views' field
export const increment = mutation({
    args: {
        id: v.string(), // Accepts ID as string
        collection: v.union(v.literal("matches"), v.literal("posts")),
    },
    handler: async (ctx, args) => {
        const id = ctx.db.normalizeId(args.collection, args.id);
        if (!id) return;

        const doc = await ctx.db.get(id);
        if (!doc) return;

        // Atomic increment
        await ctx.db.patch(id, {
            views: (doc.views || 0) + 1,
        });
    },
});
