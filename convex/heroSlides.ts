import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const getActiveSlides = query({
    handler: async (ctx) => {
        const slides = await ctx.db
            .query("hero_slides")
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // For movie/series slides, fetch the actual content
        const enrichedSlides = await Promise.all(
            slides.map(async (slide) => {
                if (slide.contentType === "movie" && slide.contentId) {
                    const movie = await ctx.db
                        .query("movies")
                        .withIndex("by_slug", (q) => q.eq("slug", slide.contentId!))
                        .first();
                    if (movie) {
                        return {
                            ...slide,
                            title: movie.title,
                            subtitle: movie.titleSomali,
                            description: movie.overview,
                            imageUrl: movie.backdropUrl || movie.posterUrl,
                            ctaLink: `/movies/${movie.slug}`,
                            movie,
                        };
                    }
                } else if (slide.contentType === "series" && slide.contentId) {
                    const series = await ctx.db
                        .query("series")
                        .withIndex("by_slug", (q) => q.eq("slug", slide.contentId!))
                        .first();
                    if (series) {
                        return {
                            ...slide,
                            title: series.title,
                            subtitle: series.titleSomali,
                            description: series.overview,
                            imageUrl: series.backdropUrl || series.posterUrl,
                            ctaLink: `/series/${series.slug}`,
                            series,
                        };
                    }
                }
                return slide;
            })
        );

        return enrichedSlides
            .filter((s) => s !== null)
            .sort((a, b) => a.order - b.order);
    },
});

export const getAllSlides = query({
    handler: async (ctx) => {
        const slides = await ctx.db.query("hero_slides").collect();

        const enrichedSlides = await Promise.all(
            slides.map(async (slide) => {
                if (slide.contentType === "movie" && slide.contentId) {
                    const movie = await ctx.db
                        .query("movies")
                        .withIndex("by_slug", (q) => q.eq("slug", slide.contentId!))
                        .first();
                    return { ...slide, content: movie };
                } else if (slide.contentType === "series" && slide.contentId) {
                    const series = await ctx.db
                        .query("series")
                        .withIndex("by_slug", (q) => q.eq("slug", slide.contentId!))
                        .first();
                    return { ...slide, content: series };
                }
                return { ...slide, content: null };
            })
        );

        return enrichedSlides.sort((a, b) => a.order - b.order);
    },
});

// ============================================
// MUTATIONS
// ============================================

export const createSlide = mutation({
    args: {
        contentType: v.union(v.literal("movie"), v.literal("series"), v.literal("custom")),
        contentId: v.optional(v.string()),
        title: v.optional(v.string()),
        subtitle: v.optional(v.string()),
        description: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        ctaText: v.optional(v.string()),
        ctaLink: v.optional(v.string()),
        order: v.number(),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("hero_slides", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateSlide = mutation({
    args: {
        id: v.id("hero_slides"),
        contentType: v.optional(v.union(v.literal("movie"), v.literal("series"), v.literal("custom"))),
        contentId: v.optional(v.string()),
        title: v.optional(v.string()),
        subtitle: v.optional(v.string()),
        description: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        ctaText: v.optional(v.string()),
        ctaLink: v.optional(v.string()),
        order: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        return await ctx.db.patch(id, {
            ...filteredUpdates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteSlide = mutation({
    args: { id: v.id("hero_slides") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

export const reorderSlides = mutation({
    args: {
        slideIds: v.array(v.id("hero_slides")),
    },
    handler: async (ctx, args) => {
        for (let i = 0; i < args.slideIds.length; i++) {
            await ctx.db.patch(args.slideIds[i], {
                order: i + 1,
                updatedAt: Date.now(),
            });
        }
    },
});
