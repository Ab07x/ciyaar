import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // ============================================
    // MATCHES
    // ============================================
    matches: defineTable({
        slug: v.string(),
        title: v.string(),
        teamA: v.string(),
        teamB: v.string(),
        articleTitle: v.optional(v.string()),
        articleContent: v.optional(v.string()),
        leagueId: v.optional(v.string()),
        leagueName: v.optional(v.string()),
        league: v.optional(v.string()), // Legacy field
        kickoffAt: v.number(),
        status: v.union(
            v.literal("upcoming"),
            v.literal("live"),
            v.literal("finished")
        ),
        isPremium: v.boolean(),
        premiumPassword: v.optional(v.union(v.string(), v.null())), // Legacy field
        requiredPlan: v.optional(
            v.union(
                v.literal("match"),
                v.literal("weekly"),
                v.literal("monthly"),
                v.literal("yearly")
            )
        ),
        embeds: v.array(
            v.object({
                label: v.string(),
                url: v.string(),
                type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                isProtected: v.optional(v.boolean()),
            })
        ),
        thumbnailUrl: v.optional(v.union(v.string(), v.null())),
        summary: v.optional(v.union(v.string(), v.null())),
        views: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_status", ["status"])
        .index("by_kickoff", ["kickoffAt"])
        .index("by_league", ["leagueId"]),

    // ============================================
    // FIXTURES (API-Football synced)
    // ============================================
    fixtures: defineTable({
        apiFixtureId: v.number(),
        slug: v.string(),
        kickoffAt: v.number(),
        kickoffISO: v.string(),
        timezone: v.string(),
        statusNormalized: v.union(
            v.literal("upcoming"),
            v.literal("live"),
            v.literal("finished")
        ),
        rawStatusShort: v.string(),
        rawStatusLong: v.string(),
        homeName: v.string(),
        homeLogo: v.string(),
        awayName: v.string(),
        awayLogo: v.string(),
        leagueName: v.string(),
        leagueLogo: v.string(),
        description: v.string(),
        fetchedForDate: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_api_id", ["apiFixtureId"])
        .index("by_slug", ["slug"])
        .index("by_status", ["statusNormalized"])
        .index("by_date", ["fetchedForDate"])
        .index("by_kickoff", ["kickoffAt"]),

    // ============================================
    // SYNC_LOGS (API sync history)
    // ============================================
    sync_logs: defineTable({
        date: v.string(),
        mode: v.union(
            v.literal("yesterday"),
            v.literal("today"),
            v.literal("tomorrow")
        ),
        ok: v.boolean(),
        fetchedCount: v.optional(v.number()),
        skippedCount: v.optional(v.number()),
        importedCount: v.number(),
        updatedCount: v.number(),
        error: v.optional(v.union(v.string(), v.null())),
        ranAt: v.number(),
    })
        .index("by_date", ["date"])
        .index("by_mode", ["mode"]),

    // ============================================
    // ALLOWED_LEAGUES (Sync filter configuration)
    // ============================================
    allowed_leagues: defineTable({
        apiLeagueId: v.optional(v.number()),
        leagueName: v.string(),
        enabled: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_name", ["leagueName"]),

    // ============================================
    // LEAGUES (Preloaded favorites)
    // ============================================
    leagues: defineTable({
        name: v.string(),
        type: v.union(
            v.literal("competition"),
            v.literal("league"),
            v.literal("club"),
            v.literal("player")
        ),
        country: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        apiId: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_type", ["type"])
        .index("by_name", ["name"]),

    // ============================================
    // POSTS (Blog/News)
    // ============================================
    posts: defineTable({
        slug: v.string(),
        title: v.string(),
        excerpt: v.string(),
        content: v.string(),
        featuredImageUrl: v.optional(v.string()),
        category: v.string(),
        tags: v.array(v.string()),
        publishedAt: v.optional(v.number()),
        isPublished: v.boolean(),
        seoTitle: v.optional(v.string()),
        seoDescription: v.optional(v.string()),
        views: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_category", ["category"])
        .index("by_published", ["isPublished"]),

    // ============================================
    // ADS (Ad slot configuration)
    // ============================================
    ads: defineTable({
        slotKey: v.string(),
        network: v.union(
            v.literal("adsense"),
            v.literal("adsterra"),
            v.literal("monetag"),
            v.literal("custom")
        ),
        format: v.union(
            v.literal("responsive"),
            v.literal("banner"),
            v.literal("native")
        ),
        codeHtml: v.optional(v.string()),
        adsenseClient: v.optional(v.string()),
        adsenseSlot: v.optional(v.string()),
        showOn: v.array(v.string()),
        enabled: v.boolean(),
    }).index("by_slot", ["slotKey"]),

    // ============================================
    // USERS
    // ============================================
    users: defineTable({
        phoneOrId: v.optional(v.string()),
        createdAt: v.number(),
    }),

    // ============================================
    // DEVICES
    // ============================================
    devices: defineTable({
        userId: v.id("users"),
        deviceId: v.string(),
        userAgent: v.optional(v.string()),
        lastSeenAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_device", ["deviceId"]),

    // ============================================
    // SUBSCRIPTIONS
    // ============================================
    subscriptions: defineTable({
        userId: v.id("users"),
        plan: v.union(
            v.literal("match"),
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("yearly")
        ),
        matchId: v.optional(v.id("matches")),
        expiresAt: v.number(),
        maxDevices: v.number(),
        status: v.union(
            v.literal("active"),
            v.literal("expired"),
            v.literal("revoked")
        ),
        codeId: v.optional(v.id("redemptions")),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_status", ["status"]),

    // ============================================
    // REDEMPTIONS (Codes)
    // ============================================
    redemptions: defineTable({
        code: v.string(),
        plan: v.union(
            v.literal("match"),
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("yearly")
        ),
        durationDays: v.number(),
        maxDevices: v.number(),
        expiresAt: v.optional(v.number()), // Unix timestamp when the code expires
        usedByUserId: v.optional(v.id("users")),
        usedAt: v.optional(v.number()),
        revokedAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_code", ["code"])
        .index("by_used", ["usedByUserId"]),

    // ============================================
    // SETTINGS (Global configuration)
    // ============================================
    settings: defineTable({
        // General
        whatsappNumber: v.string(),
        siteName: v.string(),
        adsEnabled: v.boolean(),
        // Legacy fields
        cookieDays: v.optional(v.number()),
        premiumPriceText: v.optional(v.string()),
        // Pricing (in USD)
        priceMatch: v.number(),
        priceWeekly: v.number(),
        priceMonthly: v.number(),
        priceYearly: v.number(),
        // Device limits per plan
        maxDevicesMatch: v.number(),
        maxDevicesWeekly: v.number(),
        maxDevicesMonthly: v.number(),
        maxDevicesYearly: v.number(),
    }),

    // ============================================
    // MESSAGES (Live Chat)
    // ============================================
    messages: defineTable({
        matchId: v.id("matches"),
        userId: v.id("users"),
        nickname: v.string(),
        content: v.string(),
        isPremium: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_match", ["matchId", "createdAt"])
        .index("by_user", ["userId", "createdAt"]),

    // ============================================
    // CHANNELS (Live TV iframe links)
    // ============================================
    channels: defineTable({
        slug: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        category: v.union(
            v.literal("sports"),
            v.literal("entertainment"),
            v.literal("news"),
            v.literal("movies")
        ),
        embeds: v.array(
            v.object({
                label: v.string(),
                url: v.string(),
                type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                isProtected: v.optional(v.boolean()),
            })
        ),
        isPremium: v.boolean(),
        isLive: v.boolean(),
        priority: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_category", ["category"])
        .index("by_premium", ["isPremium"])
        .index("by_live", ["isLive"]),

    // ============================================
    // MOVIES (TMDB auto-fetched)
    // ============================================
    movies: defineTable({
        // Identifiers
        slug: v.string(),
        tmdbId: v.number(),
        imdbId: v.optional(v.string()),

        // Auto-fetched from TMDB
        title: v.string(),
        titleSomali: v.optional(v.string()),
        overview: v.string(),
        overviewSomali: v.optional(v.string()),
        posterUrl: v.string(),
        backdropUrl: v.optional(v.string()),
        releaseDate: v.string(),
        runtime: v.optional(v.number()),
        rating: v.optional(v.number()),
        voteCount: v.optional(v.number()),
        genres: v.array(v.string()),
        cast: v.array(
            v.object({
                name: v.string(),
                character: v.string(),
                profileUrl: v.optional(v.string()),
            })
        ),
        director: v.optional(v.string()),

        // Admin input
        embeds: v.array(
            v.object({
                label: v.string(),
                url: v.string(),
                quality: v.optional(v.string()),
                type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                isProtected: v.optional(v.boolean()),
            })
        ),
        isDubbed: v.boolean(),
        isPremium: v.boolean(),
        isPublished: v.boolean(),

        // SEO
        seoTitle: v.optional(v.string()),
        seoDescription: v.optional(v.string()),

        // Stats
        views: v.optional(v.number()),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_tmdb", ["tmdbId"])
        .index("by_published", ["isPublished"])
        .index("by_premium", ["isPremium"])
        .index("by_dubbed", ["isDubbed"]),

    // ============================================
    // SERIES (TMDB auto-fetched)
    // ============================================
    series: defineTable({
        slug: v.string(),
        tmdbId: v.number(),
        imdbId: v.optional(v.string()),

        title: v.string(),
        titleSomali: v.optional(v.string()),
        overview: v.string(),
        overviewSomali: v.optional(v.string()),
        posterUrl: v.string(),
        backdropUrl: v.optional(v.string()),
        firstAirDate: v.string(),
        lastAirDate: v.optional(v.string()),
        status: v.string(),
        rating: v.optional(v.number()),
        genres: v.array(v.string()),
        cast: v.array(
            v.object({
                name: v.string(),
                character: v.string(),
                profileUrl: v.optional(v.string()),
            })
        ),

        numberOfSeasons: v.number(),
        numberOfEpisodes: v.number(),

        isDubbed: v.boolean(),
        isPremium: v.boolean(),
        isPublished: v.boolean(),

        seoTitle: v.optional(v.string()),
        seoDescription: v.optional(v.string()),
        views: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_tmdb", ["tmdbId"])
        .index("by_published", ["isPublished"]),

    // ============================================
    // EPISODES
    // ============================================
    episodes: defineTable({
        seriesId: v.id("series"),
        seasonNumber: v.number(),
        episodeNumber: v.number(),

        title: v.string(),
        titleSomali: v.optional(v.string()),
        overview: v.optional(v.string()),
        stillUrl: v.optional(v.string()),
        airDate: v.optional(v.string()),
        runtime: v.optional(v.number()),

        embeds: v.array(
            v.object({
                label: v.string(),
                url: v.string(),
                type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                isProtected: v.optional(v.boolean()),
            })
        ),

        isPublished: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_series", ["seriesId"])
        .index("by_season", ["seriesId", "seasonNumber"]),


    // ============================================
    // MY LIST
    // ============================================
    user_mylist: defineTable({
        userId: v.id("users"),
        contentType: v.union(
            v.literal("movie"),
            v.literal("series"),
            v.literal("match")
        ),
        contentId: v.string(), // Slug for movies/series, ID for matches
        addedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_content", ["contentType", "contentId"])
        .index("by_user_content", ["userId", "contentType", "contentId"]),

    // ============================================
    // WATCH PROGRESS
    // ============================================
    user_watch_progress: defineTable({
        userId: v.id("users"),
        contentType: v.union(
            v.literal("movie"),
            v.literal("episode"),
            v.literal("match")
        ),
        contentId: v.string(), // slug (movie), episodeId (series), matchId
        seriesId: v.optional(v.string()), // For knowing which series an episode belongs to
        progressSeconds: v.number(),
        durationSeconds: v.number(),
        isFinished: v.boolean(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_updated", ["userId", "updatedAt"])
        .index("by_user_content", ["userId", "contentType", "contentId"]),

});
