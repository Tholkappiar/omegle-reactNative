import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const getProfile = query({
    handler: async (ctx) => {
        const userID = await getAuthUserId(ctx);
        if (userID == null) {
            return;
        }
        const profile = await ctx.db
            .query("users")
            .filter((user) => user.eq(user.field("_id"), userID))
            .first();
        return profile;
    },
});
