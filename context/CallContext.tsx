import { api } from "@/convex/_generated/api";
import { useAuthToken } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native";

interface WebSocketMessage {
    type:
        | "register"
        | "offer"
        | "answer"
        | "candidate"
        | "initiate_call"
        | "accept_call"
        | "decline_call"
        | "call_accepted"
        | "call_declined"
        | "error";
    from: string;
    to: string;
    sdp?: any;
    candidate?: any;
    callId?: string;
    message?: string;
}

interface CallState {
    incomingCall: { from: string; callId: string } | null;
    setIncomingCall: (call: { from: string; callId: string } | null) => void;
    ws: WebSocket | null;
    userEmail: string;
}

const CallContext = createContext<CallState | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [incomingCall, setIncomingCall] = useState<{
        from: string;
        callId: string;
    } | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isProcessingCall, setIsProcessingCall] = useState(false);
    const router = useRouter();

    const userEmail = String(useQuery(api.user.getProfile)?.email);

    const token = useAuthToken();

    useEffect(() => {
        if (!userEmail) return;
        const websocket = new WebSocket(
            `wss://signaling-server-vl35.onrender.com?token=${token}`
        );
        websocket.onopen = () => {
            websocket.send(
                JSON.stringify({ type: "register", from: userEmail, to: "" })
            );
            setWs(websocket);
        };
        websocket.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                switch (message.type) {
                    case "initiate_call":
                        if (message.callId && !isProcessingCall) {
                            console.log(
                                "New incoming call from:",
                                message.from
                            );
                            setIncomingCall({
                                from: message.from,
                                callId: message.callId,
                            });
                        }
                        break;

                    case "call_accepted":
                        console.log("Call accepted by:", message.from);
                        setIsProcessingCall(false);
                        router.push({
                            pathname: "/(components)/Communication",
                            params: {
                                callId: message.callId,
                                peerEmail: message.from,
                            },
                        });
                        break;

                    case "call_declined":
                        console.log("Call declined by:", message.from);
                        setIsProcessingCall(false);
                        Alert.alert(
                            "Call Declined",
                            `${message.from} declined your call`
                        );
                        break;

                    case "error":
                        console.log("Error:", message.message);
                        setIsProcessingCall(false);
                        Alert.alert(
                            "Call Error",
                            message.message || "An error occurred"
                        );
                        break;

                    default:
                        break;
                }
            } catch (err) {
                console.error("WebSocket message error:", err);
            }
        };

        websocket.onerror = (err) => {
            console.error("WebSocket error:", err);
            setIsProcessingCall(false);
        };

        websocket.onclose = (event) => {
            console.log("WebSocket disconnected", event.reason);
            setWs(null);
            setIsProcessingCall(false);
        };

        return () => {
            websocket.close();
        };
    }, [userEmail, token]);

    const handleAccept = () => {
        if (!incomingCall || !ws || isProcessingCall) return;

        setIsProcessingCall(true);
        console.log("Accepting call from:", incomingCall.from);

        ws.send(
            JSON.stringify({
                type: "accept_call",
                from: userEmail,
                to: incomingCall.from,
                callId: incomingCall.callId,
            })
        );
        setIncomingCall(null);
        router.push({
            pathname: "/(components)/Communication",
            params: {
                callId: incomingCall.callId,
                peerEmail: incomingCall.from,
            },
        });
        setIsProcessingCall(false);
    };

    const handleDecline = () => {
        if (!incomingCall || !ws || isProcessingCall) return;
        setIsProcessingCall(true);
        console.log("Declining call from:", incomingCall.from);
        ws.send(
            JSON.stringify({
                type: "decline_call",
                from: userEmail,
                to: incomingCall.from,
                callId: incomingCall.callId,
            })
        );
        setIncomingCall(null);
        setIsProcessingCall(false);
    };

    return (
        <CallContext.Provider
            value={{
                incomingCall,
                setIncomingCall,
                ws,
                userEmail,
            }}
        >
            {children}

            <Modal
                visible={!!incomingCall && !isProcessingCall}
                transparent
                animationType="slide"
            >
                <View className="flex-1 justify-center items-center bg-black/70">
                    <View className="bg-white p-6 rounded-xl w-4/5 max-w-sm">
                        <Text className="text-xl font-bold mb-2 text-center">
                            Incoming Call
                        </Text>
                        <Text className="text-lg mb-6 text-center text-gray-600">
                            {incomingCall?.from}
                        </Text>
                        <View className="flex-row justify-between gap-4">
                            <TouchableOpacity
                                className="bg-red-500 p-4 rounded-lg flex-1"
                                onPress={handleDecline}
                                disabled={isProcessingCall}
                            >
                                <Text className="text-white font-bold text-center">
                                    Decline
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-blue-500 p-4 rounded-lg flex-1"
                                onPress={handleAccept}
                                disabled={isProcessingCall}
                            >
                                <Text className="text-white font-bold text-center">
                                    Accept
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCall must be used within a CallProvider");
    return context;
};
