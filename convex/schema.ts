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
        teamALogo: v.optional(v.string()),
        teamBLogo: v.optional(v.string()),
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
            v.literal("custom"),
            v.literal("vast"),
            v.literal("video"),
            v.literal("popup"),
            v.literal("ppv")
        ),
        format: v.union(
            v.literal("responsive"),
            v.literal("banner"),
            v.literal("native"),
            v.literal("interstitial"),
            v.literal("video_preroll"),
            v.literal("video_midroll"),
            v.literal("popunder"),
            v.literal("social_bar")
        ),
        // General
        codeHtml: v.optional(v.string()),
        // AdSense
        adsenseClient: v.optional(v.string()),
        adsenseSlot: v.optional(v.string()),
        // Adsterra
        adsterraKey: v.optional(v.string()),
        adsterraDomain: v.optional(v.string()),
        // VAST/VPAID
        vastUrl: v.optional(v.string()),
        vpaidEnabled: v.optional(v.boolean()),
        // Video Ad
        videoUrl: v.optional(v.string()),
        videoSkipAfter: v.optional(v.number()), // seconds before skip allowed
        videoDuration: v.optional(v.number()), // required watch duration
        // Popup/Popunder
        popupUrl: v.optional(v.string()),
        popupWidth: v.optional(v.number()),
        popupHeight: v.optional(v.number()),
        // Monetag
        monetagId: v.optional(v.string()),
        // Display settings
        showOn: v.array(v.string()),
        enabled: v.boolean(),
    }).index("by_slot", ["slotKey"]),

    // ============================================
    // USERS
    // ============================================
    users: defineTable({
        phoneOrId: v.optional(v.string()),
        // Profile (AB-25)
        displayName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        // Trial system
        trialExpiresAt: v.optional(v.number()), // When trial ends
        isTrialUsed: v.optional(v.boolean()), // Has user used trial
        // Free tier tracking
        lastFreeMovieWatchedAt: v.optional(v.number()), // Last free movie watch date
        freeMovieWatchedThisWeek: v.optional(v.string()), // Slug of free movie watched this week
        // Referrals
        referralCode: v.optional(v.string()), // Unique code for this user
        referredBy: v.optional(v.id("users")), // Who referred this user
        referralCount: v.optional(v.number()), // Number of successful referrals
        referralEarnings: v.optional(v.number()), // Total days earned
        isReferralCredited: v.optional(v.boolean()), // Has the referrer been credited for this user?
        // Timestamps
        createdAt: v.number(),
    })
        .index("by_referral_code", ["referralCode"]),

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
        priceDaily: v.optional(v.number()),
        priceWeekly: v.number(),
        priceMonthly: v.number(),
        priceYearly: v.number(),
        // New Plan Pricing
        priceStarter: v.optional(v.number()),
        pricePlus: v.optional(v.number()),
        pricePro: v.optional(v.number()),
        priceElite: v.optional(v.number()),
        // Device limits per plan
        maxDevicesMatch: v.number(),
        maxDevicesWeekly: v.number(),
        maxDevicesMonthly: v.number(),
        maxDevicesYearly: v.number(),
        // Admin Security
        adminPassword: v.optional(v.string()),

        // Branding
        logoUrl: v.optional(v.string()),
        faviconUrl: v.optional(v.string()),

        // SEO Settings
        seoTagline: v.optional(v.string()),
        seoDescription: v.optional(v.string()),
        seoKeywords: v.optional(v.string()),
        ogImage: v.optional(v.string()),
        twitterHandle: v.optional(v.string()),

        // Integrations
        googleAnalyticsId: v.optional(v.string()),
        googleVerification: v.optional(v.string()), // GCS Verification ID
        sitemapEnabled: v.optional(v.boolean()),
        footballApiKey: v.optional(v.string()),

        // Free Tier Settings
        freeMovieOfWeek: v.optional(v.string()), // Movie slug for free movie of the week
        freeMatchPreviewMinutes: v.optional(v.number()), // Minutes of free match preview (default: 15)
        trialDays: v.optional(v.number()), // Trial duration in days (default: 7)
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
        tags: v.optional(v.array(v.string())),

        // Category (Fanproj, Hindi AF Somali, etc)
        category: v.optional(v.string()),

        // SEO
        seoTitle: v.optional(v.string()),
        seoDescription: v.optional(v.string()),
        seoKeywords: v.optional(v.array(v.string())), // SEO tags/keywords

        // Stats
        views: v.optional(v.number()),

        // Featured in hero slider
        isFeatured: v.optional(v.boolean()),
        featuredOrder: v.optional(v.number()),

        // Top 10 in Somalia
        isTop10: v.optional(v.boolean()),
        top10Order: v.optional(v.number()),

        // Trailer & Download
        trailerUrl: v.optional(v.string()),
        downloadUrl: v.optional(v.string()),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_tmdb", ["tmdbId"])
        .index("by_published", ["isPublished"])
        .index("by_premium", ["isPremium"])
        .index("by_dubbed", ["isDubbed"])
        .index("by_category", ["category"])
        .index("by_featured", ["isFeatured"])
        .index("by_top10", ["isTop10"]),

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
        tags: v.optional(v.array(v.string())),

        // Category
        category: v.optional(v.string()),

        seoTitle: v.optional(v.string()),
        seoDescription: v.optional(v.string()),
        seoKeywords: v.optional(v.array(v.string())),
        views: v.optional(v.number()),

        // Featured
        isFeatured: v.optional(v.boolean()),
        featuredOrder: v.optional(v.number()),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_tmdb", ["tmdbId"])
        .index("by_published", ["isPublished"])
        .index("by_category", ["category"])
        .index("by_featured", ["isFeatured"]),

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
        overviewSomali: v.optional(v.string()),
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

    // ============================================
    // SHORTS (CiyaarSnaps)
    // ============================================
    shorts: defineTable({
        title: v.string(),
        embedUrl: v.string(), // Iframe source or video URL
        thumbnailUrl: v.string(), // Poster
        views: v.number(),
        isLive: v.boolean(),
        channelName: v.optional(v.string()), // e.g. "Gool FM"
        createdAt: v.number(),
        isPublished: v.boolean(),
    })
        .index("by_views", ["views"])
        .index("by_live", ["isLive"])
        .index("by_published", ["isPublished"]),

    // ============================================
    // PROMO BANNERS (Customizable seasonal banners)
    // ============================================
    promo_banners: defineTable({
        name: v.string(), // e.g. "Black Friday 2024", "New Year Sale"
        type: v.union(
            v.literal("main"), // Main premium promo banner
            v.literal("small"), // Small inline banner
            v.literal("popup"), // Popup/modal banner
            v.literal("interstitial") // Full-screen interstitial
        ),
        // Content
        headline: v.string(), // e.g. "Ads suck but keep the site free."
        subheadline: v.optional(v.string()), // e.g. "Remove ads and get many features"
        ctaText: v.string(), // e.g. "CHECK OPTIONS"
        ctaLink: v.string(), // e.g. "/pricing"
        // Images
        leftImageUrl: v.optional(v.string()), // Left character/image
        rightImageUrl: v.optional(v.string()), // Right character/image
        backgroundImageUrl: v.optional(v.string()), // Background image
        // Styling
        backgroundColor: v.optional(v.string()), // e.g. "#1a3a5c"
        accentColor: v.optional(v.string()), // e.g. "#9AE600"
        // Scheduling
        startDate: v.optional(v.number()), // Unix timestamp
        endDate: v.optional(v.number()), // Unix timestamp
        // Status
        isActive: v.boolean(),
        priority: v.number(), // Higher = more important
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_type", ["type"])
        .index("by_active", ["isActive"])
        .index("by_priority", ["priority"]),

    // ============================================
    // CATEGORIES (Fanproj, Hindi AF Somali, etc)
    // ============================================
    categories: defineTable({
        name: v.string(), // e.g. "Fanproj", "Hindi AF Somali"
        slug: v.string(), // e.g. "fanproj", "hindi-af-somali"
        description: v.optional(v.string()),
        iconUrl: v.optional(v.string()),
        color: v.optional(v.string()), // Hex color for styling
        order: v.number(), // Display order
        isActive: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_active", ["isActive"])
        .index("by_order", ["order"]),

    // ============================================
    // PAGE VIEWS (Analytics)
    // ============================================
    page_views: defineTable({
        date: v.string(), // YYYY-MM-DD format
        pageType: v.union(
            v.literal("home"),
            v.literal("movie"),
            v.literal("series"),
            v.literal("match"),
            v.literal("live"),
            v.literal("blog"),
            v.literal("pricing"),
            v.literal("other")
        ),
        pageId: v.optional(v.string()), // slug or ID of the specific page
        views: v.number(),
        uniqueViews: v.optional(v.number()),
    })
        .index("by_date", ["date"])
        .index("by_page_type", ["pageType"])
        .index("by_date_type", ["date", "pageType"]),

    // ============================================
    // HERO SLIDES (Admin-controlled homepage slider)
    // ============================================
    hero_slides: defineTable({
        contentType: v.union(v.literal("movie"), v.literal("series"), v.literal("custom")),
        contentId: v.optional(v.string()), // slug for movie/series
        // Custom slide fields
        title: v.optional(v.string()),
        subtitle: v.optional(v.string()),
        description: v.optional(v.string()),
        imageUrl: v.optional(v.string()), // Background image
        ctaText: v.optional(v.string()),
        ctaLink: v.optional(v.string()),
        // Display settings
        order: v.number(),
        isActive: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_active", ["isActive"])
        .index("by_order", ["order"]),

    // ============================================
    // MEDIA LIBRARY
    // ============================================
    media: defineTable({
        storageId: v.optional(v.id("_storage")), // Convex Storage ID (optional for local files)
        url: v.string(),             // Public URL (via Convex or CDN)
        name: v.string(),            // Original filename
        type: v.string(),            // MIME type
        size: v.number(),            // Bytes
        uploadedAt: v.number(),
    })
        .index("by_type", ["type"])
        .index("by_uploaded", ["uploadedAt"]),

    // ============================================
    // PAY-PER-VIEW (PPV) CONTENT
    // ============================================
    ppv_content: defineTable({
        contentType: v.union(v.literal("match"), v.literal("movie")),
        contentId: v.string(),
        title: v.string(),
        price: v.number(),
        adSupportedEnabled: v.boolean(),
        minAdsRequired: v.number(),
        accessDuration: v.number(),
        isActive: v.boolean(),
        // Ad Configuration (embedded)
        adType: v.optional(v.union(
            v.literal("video"),
            v.literal("vast"),
            v.literal("adsense"),
            v.literal("custom"),
            v.literal("image")
        )),
        adVideoUrl: v.optional(v.string()),
        adVastUrl: v.optional(v.string()),
        adImageUrl: v.optional(v.string()),
        adClickUrl: v.optional(v.string()),
        adHtml: v.optional(v.string()),
        adAdsenseClient: v.optional(v.string()),
        adAdsenseSlot: v.optional(v.string()),
        adDuration: v.optional(v.number()), // seconds
        adSkipAfter: v.optional(v.number()), // seconds, 0 = no skip
        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_content", ["contentType", "contentId"])
        .index("by_active", ["isActive"]),

    // ============================================
    // PPV PURCHASES
    // ============================================
    ppv_purchases: defineTable({
        userId: v.id("users"),
        contentType: v.union(v.literal("match"), v.literal("movie")),
        contentId: v.string(),
        ppvContentId: v.id("ppv_content"),
        price: v.number(),
        accessType: v.union(v.literal("paid"), v.literal("ad_supported")),
        adsWatched: v.number(),
        expiresAt: v.number(),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_content", ["contentType", "contentId"])
        .index("by_user_content", ["userId", "contentType", "contentId"]),

    // ============================================
    // AD IMPRESSIONS TRACKING
    // ============================================
    ad_impressions: defineTable({
        userId: v.optional(v.id("users")),
        deviceId: v.string(),
        adType: v.union(
            v.literal("interstitial"),
            v.literal("banner"),
            v.literal("midroll"),
            v.literal("preroll"),
            v.literal("ppv_unlock")
        ),
        adSlot: v.string(),
        pageType: v.string(),
        contentId: v.optional(v.string()),
        timestamp: v.number(),
    })
        .index("by_device", ["deviceId"])
        .index("by_date", ["timestamp"]),

    // ============================================
    // CONTENT REQUESTS
    // ============================================
    content_requests: defineTable({
        userId: v.id("users"),
        tmdbId: v.number(),
        type: v.union(v.literal("movie"), v.literal("tv")),
        title: v.string(),
        posterUrl: v.optional(v.string()),
        year: v.optional(v.string()),
        votes: v.number(),
        status: v.union(v.literal("pending"), v.literal("approved"), v.literal("fulfilled"), v.literal("rejected")),
        createdAt: v.number(),
    })
        .index("by_votes", ["votes"])
        .index("by_status", ["status"])
        .index("by_tmdb", ["tmdbId", "type"]),

    content_request_votes: defineTable({
        requestId: v.id("content_requests"),
        userId: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_request_user", ["requestId", "userId"])
        .index("by_user", ["userId"]),

    // ============================================
    // MATCH PREDICTIONS & LEADERBOARDS
    // ============================================
    predictions: defineTable({
        userId: v.id("users"),
        matchId: v.id("matches"),
        prediction: v.union(v.literal("home"), v.literal("away"), v.literal("draw")),
        status: v.union(v.literal("pending"), v.literal("correct"), v.literal("incorrect")),
        pointsAwarded: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_match", ["matchId"])
        .index("by_user_match", ["userId", "matchId"]),

    leaderboards: defineTable({
        userId: v.id("users"),
        totalPoints: v.number(),
        weeklyPoints: v.number(),
        monthlyPoints: v.number(),
        streakCount: v.number(),
        bestStreak: v.number(),
        predictionsCount: v.number(),
        correctPredictionsCount: v.number(),
        lastPredictionAt: v.optional(v.number()),
        updatedAt: v.number(),
    })
        .index("by_total_points", ["totalPoints"])
        .index("by_weekly_points", ["weeklyPoints"])
        .index("by_streak", ["streakCount"]),

    // ============================================
    // USER RATINGS
    // ============================================
    ratings: defineTable({
        userId: v.id("users"),
        contentType: v.union(v.literal("movie"), v.literal("series")),
        contentId: v.string(),
        rating: v.number(),
        review: v.optional(v.string()),
        isVerifiedWatch: v.boolean(),
        helpfulCount: v.number(),
        reportCount: v.number(),
        isHidden: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_content", ["contentType", "contentId"])
        .index("by_user", ["userId"])
        .index("by_user_content", ["userId", "contentType", "contentId"])
        .index("by_helpful", ["contentType", "contentId", "helpfulCount"]),

    // ============================================
    // RATING HELPFUL VOTES
    // ============================================
    rating_votes: defineTable({
        ratingId: v.id("ratings"),
        userId: v.id("users"),
        isHelpful: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_rating", ["ratingId"])
        .index("by_user_rating", ["userId", "ratingId"]),

    // ============================================
    // PUSH SUBSCRIPTIONS
    // ============================================
    push_subscriptions: defineTable({
        userId: v.optional(v.id("users")),
        deviceId: v.string(),
        endpoint: v.string(),
        keys: v.object({
            p256dh: v.string(),
            auth: v.string(),
        }),
        userAgent: v.optional(v.string()),
        isActive: v.boolean(),
        createdAt: v.number(),
        lastUsedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_device", ["deviceId"])
        .index("by_endpoint", ["endpoint"]),

    // ============================================
    // MATCH REMINDERS
    // ============================================
    match_reminders: defineTable({
        userId: v.optional(v.id("users")),
        deviceId: v.string(),
        matchId: v.id("matches"),
        notified: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_match", ["matchId"])
        .index("by_user_match", ["userId", "matchId"])
        .index("by_device_match", ["deviceId", "matchId"]),

    // ============================================
    // REFERRAL CLICKS (AB-27)
    // ============================================
    referral_clicks: defineTable({
        referralCode: v.string(),
        referrerId: v.optional(v.id("users")),
        deviceId: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        converted: v.boolean(), // Did they sign up?
        convertedUserId: v.optional(v.id("users")),
        createdAt: v.number(),
    })
        .index("by_code", ["referralCode"])
        .index("by_referrer", ["referrerId"])
        .index("by_converted", ["converted"]),

    // ============================================
    // GIFT CODES (AB-13)
    // ============================================
    gift_codes: defineTable({
        code: v.string(),
        purchaserId: v.id("users"),
        purchaserDeviceId: v.optional(v.string()),
        plan: v.union(
            v.literal("monthly"),
            v.literal("3month"),
            v.literal("yearly")
        ),
        durationDays: v.number(),
        maxDevices: v.number(),
        // Gift metadata
        recipientName: v.optional(v.string()),
        senderMessage: v.optional(v.string()),
        occasion: v.optional(v.union(
            v.literal("ramadan"),
            v.literal("eid"),
            v.literal("birthday"),
            v.literal("general")
        )),
        // Redemption
        recipientId: v.optional(v.id("users")),
        redeemedAt: v.optional(v.number()),
        // Status
        expiresAt: v.number(), // When the gift code expires (not the subscription)
        createdAt: v.number(),
    })
        .index("by_code", ["code"])
        .index("by_purchaser", ["purchaserId"])
        .index("by_recipient", ["recipientId"]),

    // ============================================
    // NOTIFICATION PREFERENCES (AB-7)
    // ============================================
    notification_preferences: defineTable({
        userId: v.optional(v.id("users")),
        deviceId: v.string(),
        // Notification types
        matchReminders: v.boolean(),
        newReleases: v.boolean(),
        promotions: v.boolean(),
        contentRequests: v.boolean(),
        // Settings
        reminderMinutesBefore: v.number(), // default: 15
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_device", ["deviceId"]),

    // ============================================
    // NOTIFICATION LOGS (AB-7)
    // ============================================
    notification_logs: defineTable({
        type: v.union(
            v.literal("match_reminder"),
            v.literal("new_release"),
            v.literal("promotion"),
            v.literal("content_fulfilled"),
            v.literal("admin_broadcast")
        ),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
        targetAudience: v.union(
            v.literal("all"),
            v.literal("premium"),
            v.literal("trial"),
            v.literal("free"),
            v.literal("specific")
        ),
        targetUserIds: v.optional(v.array(v.id("users"))),
        sentCount: v.number(),
        deliveredCount: v.optional(v.number()),
        clickedCount: v.optional(v.number()),
        createdAt: v.number(),
        sentBy: v.optional(v.string()), // "system" or admin identifier
    })
        .index("by_type", ["type"])
        .index("by_created", ["createdAt"]),

    // ============================================
    // SEARCH ANALYTICS
    // ============================================
    search_analytics: defineTable({
        query: v.string(),                              // The search query
        queryLower: v.string(),                         // Lowercase for aggregation
        resultsCount: v.number(),                       // Number of results shown
        hasResults: v.boolean(),                        // Quick flag for zero-result searches
        clickedItem: v.optional(v.string()),            // Slug of clicked result (if any)
        clickedItemType: v.optional(v.union(            // Type of clicked result
            v.literal("match"),
            v.literal("movie"),
            v.literal("series")
        )),
        deviceId: v.optional(v.string()),               // Device fingerprint
        userId: v.optional(v.id("users")),              // User if logged in
        userAgent: v.optional(v.string()),              // Browser/device info
        sessionId: v.optional(v.string()),              // Session tracking
        createdAt: v.number(),                          // Timestamp
    })
        .index("by_query", ["queryLower"])
        .index("by_created", ["createdAt"])
        .index("by_has_results", ["hasResults", "createdAt"])
        .index("by_device", ["deviceId", "createdAt"]),

});

