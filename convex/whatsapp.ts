import { v } from "convex/values";
import { action, internalAction, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// ============================================
// CONSTANTS & CONFIG
// ============================================
const WHATSAPP_API_URL = "https://graph.facebook.com/v17.0";

// ============================================
// WEBHOOK VERIFICATION (HTTP GET)
// ============================================
// This is handled via an HTTP Action in Convex (configured in http.ts usually)
// But we'll define the logic here for clarity.

// ============================================
// ACTIONS
// ============================================

// Send WhatsApp Message
export const sendMessage = action({
    args: {
        to: v.string(),
        type: v.union(v.literal("text"), v.literal("template"), v.literal("interactive")),
        content: v.any(), // Body, template name, etc.
    },
    handler: async (ctx, args) => {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        if (!token || !phoneId) {
            console.error("WhatsApp credentials missing");
            return;
        }

        const body: any = {
            messaging_product: "whatsapp",
            to: args.to,
            type: args.type,
        };

        if (args.type === "text") {
            body.text = { body: args.content.body };
        } else if (args.type === "template") {
            body.template = args.content;
        } else if (args.type === "interactive") {
            body.interactive = args.content;
        }

        try {
            const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.text();
                console.error("WhatsApp Send Error:", err);
            }
        } catch (error) {
            console.error("WhatsApp Network Error:", error);
        }
    },
});

// Process Incoming Webhook Message
export const processIncomingMessage = action({
    args: {
        from: v.string(), // Phone number
        message: v.any(), // Raw message object
    },
    handler: async (ctx, args) => {
        const from = args.from;
        const msgBody = args.message.text?.body?.toLowerCase() || "";
        const type = args.message.type;

        // 1. Identify User
        // We need to look up the user by phone number using an internal query
        const user = await ctx.runQuery(api.whatsapp.getUserByPhone, { phone: from });

        // 2. Routing Logic (Simple State Machine)

        // Greeting / Start
        if (msgBody.includes("hi") || msgBody.includes("slm") || msgBody.includes("bilaaw")) {
            await ctx.runAction(api.whatsapp.sendMessage, {
                to: from,
                type: "interactive",
                content: {
                    type: "button",
                    body: { text: "Soo dhawoow Fanbroj Support! Maxaan kuu qabtaa maanta?" },
                    action: {
                        buttons: [
                            { type: "reply", reply: { id: "check_sub", title: "Subscription-kayga" } },
                            { type: "reply", reply: { id: "payment_help", title: "Caawinaad Lacagta" } },
                            { type: "reply", reply: { id: "talk_human", title: "La Hadal Qof" } }
                        ]
                    }
                }
            });
            return;
        }

        // Handle Button Replies
        if (type === "interactive" && args.message.interactive?.type === "button_reply") {
            const replyId = args.message.interactive.button_reply.id;

            if (replyId === "check_sub") {
                if (!user) {
                    await ctx.runAction(api.whatsapp.sendMessage, {
                        to: from,
                        type: "text",
                        content: { body: "Lama helin akoon ku xiran lambarkan. Fadlan iska diiwaangeli webka." }
                    });
                } else {
                    // Check subscription status
                    const subStatus = await ctx.runQuery(api.whatsapp.checkSubscriptionStatus, { userId: user._id });
                    await ctx.runAction(api.whatsapp.sendMessage, {
                        to: from,
                        type: "text",
                        content: { body: subStatus }
                    });
                }
            } else if (replyId === "payment_help") {
                await ctx.runAction(api.whatsapp.sendMessage, {
                    to: from,
                    type: "text",
                    content: { body: "Si aad u bixiso lacagta:\n1. Gal 'Pricing'\n2. Dooro Plan\n3. Raac tilmaamaha EVC Plus/Zaad.\n\nHaddii lacagta kaa go'day oo shaqeyn weysay, fadlan soo dir Message-ka lacagta." }
                });
            } else if (replyId === "talk_human") {
                await ctx.runAction(api.whatsapp.sendMessage, {
                    to: from,
                    type: "text",
                    content: { body: "Dalabkaaga waa la gudbiyay. Shaqaale ayaa kula soo xiriiri doona dhowaan. ✅" }
                });
                // TODO: Log escalation to DB
            }
            return;
        }

        // Default Fallback
        await ctx.runAction(api.whatsapp.sendMessage, {
            to: from,
            type: "text",
            content: { body: "Fadlan dooro mid ka mid ah xulashooyinka ama qor 'Hi' si aad u bilowdo." }
        });
    },
});

// ============================================
// INTERNAL QUERIES
// ============================================

export const getUserByPhone = query({
    args: { phone: v.string() },
    handler: async (ctx, args) => {
        // Normalize phone: Remove + and whitespace
        // This is tricky if DB format differs. Assuming simple match for now.
        // In production, robust phone normalization is needed.
        return await ctx.db
            .query("users")
            // Assuming we have a way to search by phone, or scan (inefficient)
            // Ideally schema has `by_phone` index if phone is stored.
            // Using `phoneOrId` field for now which might store ID or Phone.
            .filter((q) => q.eq(q.field("phoneOrId"), args.phone))
            .first();
    },
});

export const checkSubscriptionStatus = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const sub = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();

        if (sub) {
            const expiry = new Date(sub.expiresAt).toLocaleDateString();
            return `✅ Waad leedahay subscription firfircoon (Plan: ${sub.plan}). Wuxuu dhacayaa: ${expiry}`;
        }
        return "❌ Ma lihid subscription firfircoon xilligan. Booqo fanbroj.net/pricing";
    },
});
