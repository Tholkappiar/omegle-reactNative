import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
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

export const getParticipantProfile = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const userID = await getAuthUserId(ctx);
        if (userID == null) {
            return;
        }
        const participantProfile = await ctx.db
            .query("users")
            .filter((user) => user.eq(user.field("_id"), args.email))
            .first();
        return participantProfile;
    },
});
