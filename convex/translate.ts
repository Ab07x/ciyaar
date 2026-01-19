"use node";

import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ============================================
// AI API CLIENTS
// ============================================

async function translateWithGemini(text: string, context: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found");

    const prompt = `
    You are a professional Somali translator and SEO expert. 
    Translate the following ${context} into Somali.
    
    Rules:
    1. Use natural, engaging Somali suitable for a sports/entertainment audience.
    2. Keep film/series titles in English if they are proper nouns, but you can transliterate if common.
    3. Ensure the tone is exciting and descriptive.
    4. Return ONLY the translated text, no preamble or quotes.

    Input: "${text}"
    `;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        }
    );

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

async function translateWithOpenAI(text: string, context: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not found");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a professional Somali translator. Translate the given text to Somali, mainting an exciting and engaging tone for a movie/sports platform. Return only the translated text."
                },
                {
                    role: "user",
                    content: `Context: ${context}\n\nText: ${text}`
                }
            ],
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
}

// ============================================
// QUEUE MANAGEMENT
// ============================================

export const queueTranslation = mutation({
    args: {
        entityId: v.string(),
        entityType: v.union(v.literal("movie"), v.literal("series"), v.literal("episode")),
        field: v.string(),
        sourceText: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if already queued
        const existing = await ctx.db
            .query("translation_queue")
            .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
            .filter((q) => q.eq(q.field("field"), args.field))
            .first();

        if (existing) return;

        await ctx.db.insert("translation_queue", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

export const getPendingTranslations = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("translation_queue")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .take(5);
    },
});

// ============================================
// PROCESSING ACTIONS
// ============================================

export const processOneTranslation = action({
    args: {
        queueId: v.id("translation_queue"),
    },
    handler: async (ctx, args) => {
        // 1. Get queue item
        const item = await ctx.runQuery(internal.translate.getQueueItem, { queueId: args.queueId });
        if (!item) return;

        // 2. Translate
        let translatedText = "";
        try {
            // Try Gemini first (cheaper/faster)
            try {
                translatedText = await translateWithGemini(item.sourceText, `${item.entityType} ${item.field}`);
            } catch (err) {
                console.error("Gemini failed, trying OpenAI...", err);
                translatedText = await translateWithOpenAI(item.sourceText, `${item.entityType} ${item.field}`);
            }

            if (!translatedText) throw new Error("Translation returned empty");

            // 3. Save result
            await ctx.runMutation(internal.translate.saveTranslation, {
                queueId: args.queueId,
                translatedText,
            });

        } catch (err: any) {
            console.error("Translation failed:", err);
            await ctx.runMutation(internal.translate.markFailed, {
                queueId: args.queueId,
                error: err.message,
            });
        }
    },
});

// ============================================
// INTERNAL HELPERS
// ============================================

export const getQueueItem = internalQuery({
    args: { queueId: v.id("translation_queue") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.queueId);
    },
});

export const saveTranslation = internalMutation({
    args: {
        queueId: v.id("translation_queue"),
        translatedText: v.string(),
    },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.queueId);
        if (!item) return;

        // 1. Update target entity
        if (item.entityType === "movie") {
            await ctx.db.patch(item.entityId as any, {
                [item.field === "overview" ? "overviewSomali" : "titleSomali"]: args.translatedText,
                // If it's overview, we can also generate an SEO description
                ...(item.field === "overview" ? { seoDescription: args.translatedText.slice(0, 155) + "..." } : {})
            });
        } else if (item.entityType === "series") {
            await ctx.db.patch(item.entityId as any, {
                [item.field === "overview" ? "overviewSomali" : "titleSomali"]: args.translatedText,
                ...(item.field === "overview" ? { seoDescription: args.translatedText.slice(0, 155) + "..." } : {})
            });
        }

        // 2. Update queue status
        await ctx.db.patch(args.queueId, {
            status: "done",
            translatedText: args.translatedText,
            processedAt: Date.now(),
        });
    },
});

export const markFailed = internalMutation({
    args: {
        queueId: v.id("translation_queue"),
        error: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.queueId, {
            status: "failed",
            processedAt: Date.now(),
        });
    },
});
