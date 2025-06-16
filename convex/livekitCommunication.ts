"use node";
import { v } from "convex/values";
import { AccessToken } from "livekit-server-sdk";
import { action } from "./_generated/server";

export const generateLivekitToken = action({
    args: { roomName: v.string(), participantName: v.string() },
    handler: async (ctx, args) => {
        const response = await createToken(args.roomName, args.participantName);
        return response;
    },
});

const createToken = async (roomName: string, participantName: string) => {
    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
            identity: participantName,
            // Token to expire after 10 minutes
            ttl: "10h",
        }
    );
    at.addGrant({ roomJoin: true, room: roomName });

    return await at.toJwt();
};
