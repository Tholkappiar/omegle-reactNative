// convex/livekitCommunication.ts

import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateLivekitToken = action({
    args: { roomName: v.string(), participantName: v.string() },
    handler: async (ctx, args) => {
        const response = await fetch(
            "https://cloud-api.livekit.io/api/sandbox/connection-details",
            {
                method: "POST",
                headers: {
                    "X-Sandbox-ID": "seamless-transaction-irukfh",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    roomName: args.roomName,
                    participantName: args.participantName,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.statusText}`);
        }

        const result = await response.json();
        return result.participantToken;
    },
});
