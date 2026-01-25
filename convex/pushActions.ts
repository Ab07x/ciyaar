"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import webpush from "web-push";

export const sendPush = action({
    args: {
        userId: v.id("users"),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Query must be runQuery because we are in an action
        const subscriptions = await ctx.runQuery(api.push.getUserSubscriptions, {
            userId: args.userId,
        });

        if (subscriptions.length === 0) return;

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || "mailto:support@fanbroj.net",
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        const payload = JSON.stringify({
            title: args.title,
            body: args.body,
            url: args.url,
            icon: "/icon-192.png",
        });

        await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: sub.keys,
                        },
                        payload
                    );
                } catch (error: any) {
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        // Subscription expired/invalid
                        // Call mutation to mark inactive
                        await ctx.runMutation(api.push.markInactive, { id: sub._id });
                    }
                    console.error(`Failed to send push to ${sub._id}:`, error);
                }
            })
        );
    },
});

export const sendBatchPush = action({
    args: {
        userIds: v.array(v.id("users")),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || "mailto:support@fanbroj.net",
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        const payload = JSON.stringify({
            title: args.title,
            body: args.body,
            url: args.url,
            icon: "/icon-192.png",
        });

        // Process users in series or small parallel chunks to avoid overloading the worker
        for (const userId of args.userIds) {
            const subscriptions = await ctx.runQuery(api.push.getUserSubscriptions, {
                userId,
            });

            if (subscriptions.length === 0) continue;

            await Promise.allSettled(
                subscriptions.map(async (sub) => {
                    try {
                        await webpush.sendNotification(
                            {
                                endpoint: sub.endpoint,
                                keys: sub.keys,
                            },
                            payload
                        );
                    } catch (error: any) {
                        if (error.statusCode === 410 || error.statusCode === 404) {
                            await ctx.runMutation(api.push.markInactive, { id: sub._id });
                        }
                        console.error(`Failed to send push to ${sub._id} for user ${userId}:`, error);
                    }
                })
            );
        }
    },
});
