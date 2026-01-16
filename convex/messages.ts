import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { matchId: v.id("matches"), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
            .order("desc")
            .take(args.limit || 50);
    },
});

export const send = mutation({
    args: {
        matchId: v.id("matches"),
        userId: v.id("users"),
        nickname: v.string(),
        content: v.string(),
        isPremium: v.boolean(),
    },
    handler: async (ctx, args) => {
        // Validation
        const content = args.content.trim();
        if (!content) throw new Error("Fariintu ma noqon karto mid maran");
        if (content.length > 500) throw new Error("Muddada farriintu aad bay u dheer tahay");

        // Rate limiting: 3 seconds between messages
        const lastMessage = await ctx.db
            .query("messages")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .first();

        if (lastMessage && Date.now() - lastMessage.createdAt < 3000) {
            throw new Error("Fadlan sug dhowr ilbiriqsi ka hor inta aadan dirin fariin kale.");
        }

        return await ctx.db.insert("messages", {
            ...args,
            content,
            createdAt: Date.now(),
        });
    },
});
