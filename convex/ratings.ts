import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

// Get ratings for specific content
export const getContentRatings = query({
    args: {
        contentType: v.union(v.literal("movie"), v.literal("series")),
        contentId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;

        const ratings = await ctx.db
            .query("ratings")
            .withIndex("by_content", (q) =>
                q.eq("contentType", args.contentType).eq("contentId", args.contentId)
            )
            .filter((q) => q.eq(q.field("isHidden"), false))
            .order("desc")
            .take(limit);

        // Get user info for each rating
        const ratingsWithUsers = await Promise.all(
            ratings.map(async (rating) => {
                const user = await ctx.db.get(rating.userId);
                return {
                    ...rating,
                    userName: user?.phoneOrId ? `User ${user.phoneOrId.slice(-4)}` : "Anonymous",
                };
            })
        );

        return ratingsWithUsers;
    },
});

// Get average rating for content
export const getContentAverageRating = query({
    args: {
        contentType: v.union(v.literal("movie"), v.literal("series")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        const ratings = await ctx.db
            .query("ratings")
            .withIndex("by_content", (q) =>
                q.eq("contentType", args.contentType).eq("contentId", args.contentId)
            )
            .filter((q) => q.eq(q.field("isHidden"), false))
            .collect();

        if (ratings.length === 0) {
            return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
        }

        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / ratings.length;

        // Calculate distribution (1-5 stars)
        const distribution = [0, 0, 0, 0, 0];
        ratings.forEach((r) => {
            distribution[r.rating - 1]++;
        });

        return {
            average: Math.round(average * 10) / 10,
            count: ratings.length,
            distribution,
        };
    },
});

// Get user's rating for specific content
export const getUserRating = query({
    args: {
        userId: v.id("users"),
        contentType: v.union(v.literal("movie"), v.literal("series")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("ratings")
            .withIndex("by_user_content", (q) =>
                q
                    .eq("userId", args.userId)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();
    },
});

// Get all ratings by a user
export const getUserRatings = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;

        return await ctx.db
            .query("ratings")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);
    },
});

// Get top rated content (admin/featured)
export const getTopRatedContent = query({
    args: {
        contentType: v.optional(v.union(v.literal("movie"), v.literal("series"))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;

        // Get all content IDs with ratings
        let allRatings = await ctx.db
            .query("ratings")
            .filter((q) => q.eq(q.field("isHidden"), false))
            .collect();

        if (args.contentType) {
            allRatings = allRatings.filter((r) => r.contentType === args.contentType);
        }

        // Group by content
        const contentMap = new Map<
            string,
            { contentType: string; contentId: string; ratings: number[]; count: number }
        >();

        allRatings.forEach((r) => {
            const key = `${r.contentType}:${r.contentId}`;
            if (!contentMap.has(key)) {
                contentMap.set(key, {
                    contentType: r.contentType,
                    contentId: r.contentId,
                    ratings: [],
                    count: 0,
                });
            }
            const entry = contentMap.get(key)!;
            entry.ratings.push(r.rating);
            entry.count++;
        });

        // Calculate averages and sort
        const ranked = Array.from(contentMap.values())
            .map((entry) => ({
                ...entry,
                average:
                    entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length,
            }))
            .filter((entry) => entry.count >= 3) // Minimum 3 ratings
            .sort((a, b) => b.average - a.average)
            .slice(0, limit);

        return ranked;
    },
});

// Get recent reviews (with text) for homepage/featured
export const getRecentReviews = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 5;

        const reviews = await ctx.db
            .query("ratings")
            .filter((q) =>
                q.and(
                    q.eq(q.field("isHidden"), false),
                    q.neq(q.field("review"), undefined)
                )
            )
            .order("desc")
            .take(limit);

        // Get user info
        const reviewsWithUsers = await Promise.all(
            reviews.map(async (review) => {
                const user = await ctx.db.get(review.userId);
                return {
                    ...review,
                    userName: user?.phoneOrId ? `User ${user.phoneOrId.slice(-4)}` : "Anonymous",
                };
            })
        );

        return reviewsWithUsers;
    },
});

// ============================================
// MUTATIONS
// ============================================

// Create or update a rating
export const upsertRating = mutation({
    args: {
        userId: v.id("users"),
        contentType: v.union(v.literal("movie"), v.literal("series")),
        contentId: v.string(),
        rating: v.number(),
        review: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Validate rating (1-5)
        if (args.rating < 1 || args.rating > 5) {
            return { success: false, error: "Rating must be between 1 and 5" };
        }

        const now = Date.now();

        // Check for existing rating
        const existing = await ctx.db
            .query("ratings")
            .withIndex("by_user_content", (q) =>
                q
                    .eq("userId", args.userId)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        if (existing) {
            // Update existing
            await ctx.db.patch(existing._id, {
                rating: args.rating,
                review: args.review,
                updatedAt: now,
            });
            return { success: true, id: existing._id, action: "updated" };
        } else {
            // Create new
            const id = await ctx.db.insert("ratings", {
                userId: args.userId,
                contentType: args.contentType,
                contentId: args.contentId,
                rating: args.rating,
                review: args.review,
                isVerifiedWatch: false,
                helpfulCount: 0,
                reportCount: 0,
                isHidden: false,
                createdAt: now,
                updatedAt: now,
            });
            return { success: true, id, action: "created" };
        }
    },
});

// Delete a rating
export const deleteRating = mutation({
    args: {
        ratingId: v.id("ratings"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const rating = await ctx.db.get(args.ratingId);

        if (!rating) {
            return { success: false, error: "Rating not found" };
        }

        if (rating.userId !== args.userId) {
            return { success: false, error: "Not authorized" };
        }

        await ctx.db.delete(args.ratingId);
        return { success: true };
    },
});

// Mark rating as helpful
export const markHelpful = mutation({
    args: {
        ratingId: v.id("ratings"),
    },
    handler: async (ctx, args) => {
        const rating = await ctx.db.get(args.ratingId);

        if (!rating) {
            return { success: false, error: "Rating not found" };
        }

        await ctx.db.patch(args.ratingId, {
            helpfulCount: rating.helpfulCount + 1,
        });

        return { success: true, newCount: rating.helpfulCount + 1 };
    },
});

// Report a rating (admin moderation)
export const reportRating = mutation({
    args: {
        ratingId: v.id("ratings"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const rating = await ctx.db.get(args.ratingId);

        if (!rating) {
            return { success: false, error: "Rating not found" };
        }

        const newReportCount = rating.reportCount + 1;

        // Auto-hide if reported 3+ times
        await ctx.db.patch(args.ratingId, {
            reportCount: newReportCount,
            isHidden: newReportCount >= 3,
        });

        return { success: true, hidden: newReportCount >= 3 };
    },
});

// Admin: Hide/unhide a rating
export const setRatingVisibility = mutation({
    args: {
        ratingId: v.id("ratings"),
        isHidden: v.boolean(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.ratingId, {
            isHidden: args.isHidden,
        });

        return { success: true };
    },
});

// Admin: Mark rating as verified watch
export const setVerifiedWatch = mutation({
    args: {
        ratingId: v.id("ratings"),
        isVerified: v.boolean(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.ratingId, {
            isVerifiedWatch: args.isVerified,
        });

        return { success: true };
    },
});

// Admin: Get all ratings for moderation
export const getAllRatingsForModeration = query({
    args: {
        showHidden: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;

        let ratingsQuery = ctx.db.query("ratings").order("desc");

        if (!args.showHidden) {
            ratingsQuery = ratingsQuery.filter((q) =>
                q.eq(q.field("isHidden"), false)
            );
        }

        const ratings = await ratingsQuery.take(limit);

        // Get user info
        const ratingsWithUsers = await Promise.all(
            ratings.map(async (rating) => {
                const user = await ctx.db.get(rating.userId);
                return {
                    ...rating,
                    userName: user?.phoneOrId ? `User ${user.phoneOrId.slice(-4)}` : "Anonymous",
                    userPhone: user?.phoneOrId,
                };
            })
        );

        return ratingsWithUsers;
    },
});
