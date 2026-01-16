import { mutation } from "./_generated/server";

export const enableAll = mutation({
    handler: async (ctx) => {
        // Enable global settings
        const settings = await ctx.db.query("settings").first();
        if (settings) {
            await ctx.db.patch(settings._id, { adsEnabled: true });
        }

        // Enable all ads
        const ads = await ctx.db.query("ads").collect();
        for (const ad of ads) {
            await ctx.db.patch(ad._id, { enabled: true });
        }

        return `Enabled ${ads.length} ads and global settings.`;
    },
});
