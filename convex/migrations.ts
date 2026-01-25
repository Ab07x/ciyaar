import { internalMutation } from "./_generated/server";

export const migrateMatchesLeagueId = internalMutation({
    args: {},
    handler: async (ctx) => {
        const matches = await ctx.db.query("matches").collect();
        const leagues = await ctx.db.query("leagues").collect();
        let updatedCount = 0;

        for (const match of matches) {
            // If already has leagueId, skip
            if (match.leagueId && match.leagueId.length > 0) continue;

            // If has legacy league name
            if (match.league) {
                // Find matching league by name
                const leagueDoc = leagues.find(
                    (l) => l.name.toLowerCase() === match.league!.toLowerCase()
                );

                if (leagueDoc) {
                    await ctx.db.patch(match._id, {
                        leagueId: leagueDoc._id,
                        leagueName: leagueDoc.name, // Ensure consistent name
                    });
                    updatedCount++;
                } else {
                    // Optional: Create league if it doesn't exist? 
                    // For now, let's just log it or skip.
                    console.log(`No league found for match ${match.title} with league ${match.league}`);
                }
            }
        }

        return { updatedCount };
    },
});
