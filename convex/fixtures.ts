/**
 * API-Football Fixtures Sync Module
 * 
 * Server-side only - NO client exposure
 * All API calls via Convex Actions
 */

import { v } from "convex/values";
import { action, mutation, query, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================
// CONSTANTS
// ============================================

const API_BASE_URL = "https://v3.football.api-sports.io";
const TIMEZONE = "Africa/Mogadishu";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// Status normalization mapping
const STATUS_MAP: Record<string, "upcoming" | "live" | "finished"> = {
    // Upcoming
    "NS": "upcoming",
    "TBD": "upcoming",
    // Live
    "1H": "live",
    "HT": "live",
    "2H": "live",
    "ET": "live",
    "P": "live",
    "LIVE": "live",
    "BT": "live",
    // Finished
    "FT": "finished",
    "AET": "finished",
    "PEN": "finished",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create URL-safe slug from team names and date
 */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function createFixtureSlug(homeName: string, awayName: string, dateStr: string): string {
    const home = slugify(homeName);
    const away = slugify(awayName);
    const date = dateStr.replace(/-/g, "");
    return `${home}-vs-${away}-${date}`;
}

/**
 * Get date string for mode in Africa/Mogadishu timezone
 */
function getDateForMode(mode: "yesterday" | "today" | "tomorrow"): string {
    const now = new Date();
    // Africa/Mogadishu is UTC+3
    const mogadishuOffset = 3 * 60 * 60 * 1000;
    const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
    const mogadishuNow = new Date(utcNow + mogadishuOffset);

    if (mode === "yesterday") {
        mogadishuNow.setDate(mogadishuNow.getDate() - 1);
    } else if (mode === "tomorrow") {
        mogadishuNow.setDate(mogadishuNow.getDate() + 1);
    }

    const year = mogadishuNow.getFullYear();
    const month = String(mogadishuNow.getMonth() + 1).padStart(2, "0");
    const day = String(mogadishuNow.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Get today's date in Africa/Mogadishu timezone
 */
function getTodayDate(): string {
    return getDateForMode("today");
}

/**
 * Normalize API status to internal status
 */
function normalizeStatus(rawShort: string): "upcoming" | "live" | "finished" {
    return STATUS_MAP[rawShort] || "upcoming";
}

/**
 * Generate fallback Somali description (no AI call)
 */
function generateFallbackDescription(
    homeName: string,
    awayName: string,
    leagueName: string,
    status: "upcoming" | "live" | "finished"
): string {
    if (status === "upcoming") {
        return `${homeName} vs ${awayName} waa ciyaar ka tirsan ${leagueName}. Daawo ciyaarta maanta Fanbroj si toos ah.`;
    } else if (status === "live") {
        return `${homeName} vs ${awayName} hadda waa socota oo waa ciyaar ka tirsan ${leagueName}. Daawo ciyaarta live Fanbroj.`;
    } else {
        return `${homeName} vs ${awayName} waa ciyaar ka tirsan ${leagueName}. Ciyaartu way dhamaatay. Natiijooyinka iyo dib-u-eegista ciyaarta ayaa lasoo gelin doonaa dhowaan Fanbroj.`;
    }
}

// ============================================
// RAW API TYPES
// ============================================

interface RawFixture {
    fixture: {
        id: number;
        date: string;
        timestamp: number;
        timezone: string;
        status: {
            short: string;
            long: string;
        };
    };
    league: {
        name: string;
        logo: string;
    };
    teams: {
        home: { name: string; logo: string };
        away: { name: string; logo: string };
    };
}

interface NormalizedFixture {
    apiFixtureId: number;
    slug: string;
    kickoffAt: number;
    kickoffISO: string;
    timezone: string;
    statusNormalized: "upcoming" | "live" | "finished";
    rawStatusShort: string;
    rawStatusLong: string;
    homeName: string;
    homeLogo: string;
    awayName: string;
    awayLogo: string;
    leagueName: string;
    leagueLogo: string;
    description: string;
    fetchedForDate: string;
}

// ============================================
// INTERNAL ACTIONS (Server-side API calls)
// ============================================

/**
 * Fetch fixtures from API-Football for a specific date
 */
export const internalFetchFixtures = internalAction({
    args: { dateString: v.string() },
    handler: async (_ctx, args): Promise<{ ok: boolean; data: RawFixture[]; error?: string }> => {
        const apiKey = process.env.APISPORTS_KEY;
        console.log("Debug: Checking APISPORTS_KEY...");
        console.log("Debug: Env Keys available:", Object.keys(process.env).filter(k => k.includes("API")).join(", "));
        console.log("Debug: Key status:", apiKey ? "Found" : "Missing");

        if (!apiKey) {
            return { ok: false, data: [], error: "APISPORTS_KEY not configured" };
        }

        try {
            const url = `${API_BASE_URL}/fixtures?date=${args.dateString}&timezone=${TIMEZONE}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "x-apisports-key": apiKey,
                },
            });

            if (!response.ok) {
                return {
                    ok: false,
                    data: [],
                    error: `API returned ${response.status}: ${response.statusText}`,
                };
            }

            const json = await response.json();

            if (json.errors && Object.keys(json.errors).length > 0) {
                return {
                    ok: false,
                    data: [],
                    error: JSON.stringify(json.errors),
                };
            }

            return {
                ok: true,
                data: json.response || [],
            };
        } catch (error) {
            return {
                ok: false,
                data: [],
                error: error instanceof Error ? error.message : "Unknown fetch error",
            };
        }
    },
});

/**
 * Generate Somali description using DeepSeek API
 */
export const internalGenerateDescription = internalAction({
    args: {
        homeName: v.string(),
        awayName: v.string(),
        leagueName: v.string(),
        status: v.union(v.literal("upcoming"), v.literal("live"), v.literal("finished")),
    },
    handler: async (_ctx, args): Promise<string> => {
        const apiKey = process.env.DEEPSEEK_API_KEY;

        // Fallback if no API key
        if (!apiKey) {
            return generateFallbackDescription(args.homeName, args.awayName, args.leagueName, args.status);
        }

        const statusText = args.status === "upcoming" ? "soo socota / bilaaban doonta" : args.status === "live" ? "hadda socota / live ah" : "dhammaatay / soo idlaatay";

        const prompt = `Qor sharaxaad gaaban (2 jumlad) oo Af-Soomaali ah ciyaarta "${args.homeName} vs ${args.awayName}" ee horyaalka "${args.leagueName}". 
        Xaaladda ciyaartu waa: ${statusText}.
        Tone: Neutral, SEO-friendly, Somali sports journalism.
        Include "Fanbroj". 
        Pattern example: "${args.homeName} vs ${args.awayName} waa ciyaar ka tirsan ${args.leagueName}. Daawo ciyaarta maanta Fanbroj si toos ah."`;

        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 150,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                return generateFallbackDescription(args.homeName, args.awayName, args.leagueName, args.status);
            }

            const json = await response.json();
            const content = json.choices?.[0]?.message?.content?.trim();

            return content || generateFallbackDescription(args.homeName, args.awayName, args.leagueName, args.status);
        } catch {
            return generateFallbackDescription(args.homeName, args.awayName, args.leagueName, args.status);
        }
    },
});

// ============================================
// INTERNAL MUTATIONS (Database writes)
// ============================================

/**
 * Upsert a single fixture
 */
export const upsertFixture = internalMutation({
    args: {
        apiFixtureId: v.number(),
        slug: v.string(),
        kickoffAt: v.number(),
        kickoffISO: v.string(),
        timezone: v.string(),
        statusNormalized: v.union(v.literal("upcoming"), v.literal("live"), v.literal("finished")),
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
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("fixtures")
            .withIndex("by_api_id", (q) => q.eq("apiFixtureId", args.apiFixtureId))
            .first();

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                updatedAt: now,
            });
            return { action: "updated" as const, id: existing._id };
        } else {
            const id = await ctx.db.insert("fixtures", {
                ...args,
                createdAt: now,
                updatedAt: now,
            });
            return { action: "inserted" as const, id };
        }
    },
});

/**
 * Write sync log entry
 */
export const writeSyncLog = internalMutation({
    args: {
        date: v.string(),
        mode: v.union(v.literal("yesterday"), v.literal("today"), v.literal("tomorrow")),
        ok: v.boolean(),
        fetchedCount: v.number(),
        skippedCount: v.number(),
        importedCount: v.number(),
        updatedCount: v.number(),
        error: v.optional(v.union(v.string(), v.null())),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("sync_logs", {
            ...args,
            ranAt: Date.now(),
        });
    },
});

/**
 * Internal query to get allowed league names for sync filtering
 */
export const internalGetAllowedLeagueNames = internalQuery({
    args: {},
    handler: async (ctx) => {
        const leagues = await ctx.db
            .query("allowed_leagues")
            .collect();
        return leagues.filter(l => l.enabled).map(l => l.leagueName);
    },
});

// ============================================
// PUBLIC ACTIONS (Admin-triggered sync)
// ============================================

/**
 * Internal sync fixtures for a specific mode (used by syncAll3Days)
 * Filters fixtures to only include allowed leagues
 */
export const internalSyncFixtures = internalAction({
    args: {
        mode: v.union(v.literal("yesterday"), v.literal("today"), v.literal("tomorrow")),
    },
    handler: async (ctx, args): Promise<{ ok: boolean; fetched: number; skipped: number; imported: number; updated: number; error?: string }> => {
        const dateString = getDateForMode(args.mode);

        // Fetch from API
        const fetchResult = await ctx.runAction(internal.fixtures.internalFetchFixtures, {
            dateString,
        });

        if (!fetchResult.ok) {
            await ctx.runMutation(internal.fixtures.writeSyncLog, {
                date: dateString,
                mode: args.mode,
                ok: false,
                fetchedCount: 0,
                skippedCount: 0,
                importedCount: 0,
                updatedCount: 0,
                error: fetchResult.error,
            });
            return { ok: false, fetched: 0, skipped: 0, imported: 0, updated: 0, error: fetchResult.error };
        }

        // Get allowed league names from database
        const allowedLeagues = await ctx.runQuery(internal.fixtures.internalGetAllowedLeagueNames);
        const allowedSet = new Set(allowedLeagues);

        let fetched = fetchResult.data.length;
        let skipped = 0;
        let imported = 0;
        let updated = 0;

        // Process each fixture with league filtering
        for (const raw of fetchResult.data) {
            const leagueName = raw.league.name;

            // Skip if league is not in allowed list
            if (!allowedSet.has(leagueName)) {
                skipped++;
                continue;
            }

            const statusNormalized = normalizeStatus(raw.fixture.status.short);

            // Generate description
            const description = await ctx.runAction(internal.fixtures.internalGenerateDescription, {
                homeName: raw.teams.home.name,
                awayName: raw.teams.away.name,
                leagueName: leagueName,
                status: statusNormalized,
            });

            const normalized: NormalizedFixture = {
                apiFixtureId: raw.fixture.id,
                slug: createFixtureSlug(raw.teams.home.name, raw.teams.away.name, dateString),
                kickoffAt: raw.fixture.timestamp * 1000,
                kickoffISO: raw.fixture.date,
                timezone: raw.fixture.timezone || TIMEZONE,
                statusNormalized,
                rawStatusShort: raw.fixture.status.short,
                rawStatusLong: raw.fixture.status.long,
                homeName: raw.teams.home.name,
                homeLogo: raw.teams.home.logo,
                awayName: raw.teams.away.name,
                awayLogo: raw.teams.away.logo,
                leagueName: leagueName,
                leagueLogo: raw.league.logo,
                description,
                fetchedForDate: dateString,
            };

            const result = await ctx.runMutation(internal.fixtures.upsertFixture, normalized);

            if (result.action === "inserted") {
                imported++;
            } else {
                updated++;
            }
        }

        // Write success log with all counts
        await ctx.runMutation(internal.fixtures.writeSyncLog, {
            date: dateString,
            mode: args.mode,
            ok: true,
            fetchedCount: fetched,
            skippedCount: skipped,
            importedCount: imported,
            updatedCount: updated,
            error: null,
        });

        console.log(`[Sync ${args.mode}] Fetched: ${fetched}, Skipped: ${skipped}, Imported: ${imported}, Updated: ${updated}`);

        return { ok: true, fetched, skipped, imported, updated };
    },
});

/**
 * Public sync fixtures for a specific mode (yesterday/today/tomorrow)
 */
export const syncFixtures = action({
    args: {
        mode: v.union(v.literal("yesterday"), v.literal("today"), v.literal("tomorrow")),
    },
    handler: async (ctx, args): Promise<{ ok: boolean; fetched: number; skipped: number; imported: number; updated: number; error?: string }> => {
        return await ctx.runAction(internal.fixtures.internalSyncFixtures, { mode: args.mode });
    },
});

/**
 * Sync all 3 days (for cron jobs or admin trigger)
 */
export const syncAll3Days = action({
    args: {},
    handler: async (ctx): Promise<{
        yesterday: { ok: boolean; imported: number; updated: number };
        today: { ok: boolean; imported: number; updated: number };
        tomorrow: { ok: boolean; imported: number; updated: number };
    }> => {
        const yesterday = await ctx.runAction(internal.fixtures.internalSyncFixtures, { mode: "yesterday" });
        const today = await ctx.runAction(internal.fixtures.internalSyncFixtures, { mode: "today" });
        const tomorrow = await ctx.runAction(internal.fixtures.internalSyncFixtures, { mode: "tomorrow" });

        return {
            yesterday: { ok: yesterday.ok, imported: yesterday.imported, updated: yesterday.updated },
            today: { ok: today.ok, imported: today.imported, updated: today.updated },
            tomorrow: { ok: tomorrow.ok, imported: tomorrow.imported, updated: tomorrow.updated },
        };
    },
});

// ============================================
// QUERIES (Read from database only)
// ============================================

/**
 * Get fixtures for a specific day mode
 */
export const getFixturesByDay = query({
    args: {
        mode: v.union(v.literal("yesterday"), v.literal("today"), v.literal("tomorrow")),
    },
    handler: async (ctx, args) => {
        const dateString = getDateForMode(args.mode);

        return await ctx.db
            .query("fixtures")
            .withIndex("by_date", (q) => q.eq("fetchedForDate", dateString))
            .order("asc")
            .collect();
    },
});

/**
 * Get all live fixtures
 */
export const getLiveNow = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("fixtures")
            .withIndex("by_status", (q) => q.eq("statusNormalized", "live"))
            .order("asc")
            .collect();
    },
});

/**
 * Get upcoming fixtures for today
 */
export const getUpcomingToday = query({
    args: {},
    handler: async (ctx) => {
        const today = getTodayDate();

        const fixtures = await ctx.db
            .query("fixtures")
            .withIndex("by_date", (q) => q.eq("fetchedForDate", today))
            .collect();

        return fixtures.filter((f) => f.statusNormalized === "upcoming");
    },
});

/**
 * Get finished fixtures for today
 */
export const getFinishedToday = query({
    args: {},
    handler: async (ctx) => {
        const today = getTodayDate();

        const fixtures = await ctx.db
            .query("fixtures")
            .withIndex("by_date", (q) => q.eq("fetchedForDate", today))
            .collect();

        return fixtures.filter((f) => f.statusNormalized === "finished");
    },
});

/**
 * Get fixture by slug
 */
export const getFixtureBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("fixtures")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

/**
 * Get fixture by API ID
 */
export const getFixtureByApiId = query({
    args: { apiFixtureId: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("fixtures")
            .withIndex("by_api_id", (q) => q.eq("apiFixtureId", args.apiFixtureId))
            .first();
    },
});

/**
 * Get sync logs (for admin monitoring)
 */
export const getSyncLogs = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const logs = await ctx.db.query("sync_logs").order("desc").collect();
        return args.limit ? logs.slice(0, args.limit) : logs;
    },
});

/**
 * Get all fixtures sorted by kickoff time
 */
export const getAllFixtures = query({
    args: {
        status: v.optional(v.union(v.literal("upcoming"), v.literal("live"), v.literal("finished"))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let fixtures;

        if (args.status) {
            fixtures = await ctx.db
                .query("fixtures")
                .withIndex("by_status", (q) => q.eq("statusNormalized", args.status!))
                .order("asc")
                .collect();
        } else {
            fixtures = await ctx.db.query("fixtures").withIndex("by_kickoff").order("asc").collect();
        }

        return args.limit ? fixtures.slice(0, args.limit) : fixtures;
    },
});
