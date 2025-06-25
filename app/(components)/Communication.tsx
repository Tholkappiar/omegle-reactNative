import { useCall } from "@/context/CallContext";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    mediaDevices,
    MediaStream,
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription,
    RTCView,
} from "react-native-webrtc";

interface WebSocketMessage {
    type:
        | "offer"
        | "answer"
        | "candidate"
        | "initiate_call"
        | "accept_call"
        | "decline_call"
        | "error"
        | "chat";
    from: string;
    to: string;
    sdp?: any;
    candidate?: any;
    callId?: string;
    message?: string;
    timestamp?: number;
}

interface ChatMessage {
    id: string;
    from: string;
    message: string;
    timestamp: number;
}

const Communication = () => {
    const [localMediaStream, setLocalMediaStream] =
        useState<MediaStream | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] =
        useState<MediaStream | null>(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [callStatus, setCallStatus] = useState<string>("Connecting...");

    const [ChatSectionStatus, setChatSectionStatus] = useState<boolean>(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const { ws, userEmail } = useCall();
    const params = useLocalSearchParams();
    const { callId, peerEmail } = params as {
        callId: string;
        peerEmail: string;
    };

    const peerConstraints = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ],
        iceCandidatePoolSize: 10,
    };

    async function getLocalStream() {
        try {
            const devices = await mediaDevices.enumerateDevices();
            const videoDevice = devices.find(
                (device) =>
                    device.kind === "videoinput" && device.facing === "front"
            );

            const mediaStream = await mediaDevices.getUserMedia({
                audio: true,
                video: {
                    facingMode: "user",
                    frameRate: 30,
                    deviceId: videoDevice?.deviceId,
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                },
            });

            setLocalMediaStream(mediaStream);
            return mediaStream;
        } catch (err) {
            console.error("Error getting local stream:", err);
            setCallStatus("Failed to access camera/microphone");
            throw err;
        }
    }

    function initializePeerConnection() {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        const peerConnection = new RTCPeerConnection(peerConstraints);
        peerConnectionRef.current = peerConnection;

        peerConnection.ontrack = (event) => {
            console.log("Received remote track");
            if (event.streams && event.streams[0]) {
                setRemoteMediaStream(event.streams[0]);
                setCallStatus("Connected");
                setIsConnecting(false);
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && ws) {
                console.log("Sending ICE candidate");
                ws.send(
                    JSON.stringify({
                        type: "candidate",
                        from: userEmail,
                        to: peerEmail,
                        candidate: event.candidate,
                        callId: callId,
                    })
                );
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log("Connection state:", peerConnection.connectionState);
            switch (peerConnection.connectionState) {
                case "connected":
                    setCallStatus("Connected");
                    setIsConnecting(false);
                    break;
                case "connecting":
                    setCallStatus("Connecting...");
                    break;
                case "disconnected":
                    setCallStatus("Disconnected");
                    break;
                case "failed":
                    setCallStatus("Connection failed");
                    break;
                case "closed":
                    setCallStatus("Call ended");
                    break;
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log(
                "ICE connection state:",
                peerConnection.iceConnectionState
            );
        };

        return peerConnection;
    }

    async function createOffer() {
        try {
            if (!peerConnectionRef.current) return;

            console.log("Creating offer");
            const offerDescription =
                await peerConnectionRef.current.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                });

            await peerConnectionRef.current.setLocalDescription(
                offerDescription
            );

            if (ws) {
                ws.send(
                    JSON.stringify({
                        type: "offer",
                        from: userEmail,
                        to: peerEmail,
                        sdp: offerDescription,
                        callId: callId,
                    })
                );
                console.log("Offer sent");
            }
        } catch (err) {
            console.error("Error creating offer:", err);
            setCallStatus("Failed to create offer");
        }
    }

    async function handleOffer(sdp: any) {
        try {
            if (!peerConnectionRef.current) return;

            console.log("Handling received offer");
            await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(sdp)
            );

            const answerDescription =
                await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(
                answerDescription
            );

            if (ws) {
                ws.send(
                    JSON.stringify({
                        type: "answer",
                        from: userEmail,
                        to: peerEmail,
                        sdp: answerDescription,
                        callId: callId,
                    })
                );
                console.log("Answer sent");
            }
        } catch (err) {
            console.error("Error handling offer:", err);
            setCallStatus("Failed to handle offer");
        }
    }

    async function handleAnswer(sdp: any) {
        try {
            if (!peerConnectionRef.current) return;

            console.log("Handling received answer");
            await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(sdp)
            );
        } catch (err) {
            console.error("Error handling answer:", err);
            setCallStatus("Failed to handle answer");
        }
    }

    async function handleIceCandidate(candidate: any) {
        try {
            if (!peerConnectionRef.current) return;

            console.log("Adding ICE candidate");
            await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        } catch (err) {
            console.error("Error adding ICE candidate:", err);
        }
    }

    function endCall() {
        try {
            if (localMediaStream) {
                localMediaStream.getTracks().forEach((track) => track.stop());
                setLocalMediaStream(null);
            }

            if (remoteMediaStream) {
                remoteMediaStream.getTracks().forEach((track) => track.stop());
                setRemoteMediaStream(null);
            }

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            // Navigate back
            router.replace("/(tabs)/CallInitiation");
        } catch (err) {
            console.error("Error ending call:", err);
            router.replace("/(tabs)/CallInitiation");
        }
    }

    useEffect(() => {
        if (!ws) return;

        const messageHandler = (event: MessageEvent) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);

                if (message.callId !== callId) return;

                console.log("Received WebSocket message:", message.type);

                switch (message.type) {
                    case "offer":
                        handleOffer(message.sdp);
                        break;
                    case "answer":
                        handleAnswer(message.sdp);
                        break;
                    case "candidate":
                        handleIceCandidate(message.candidate);
                        break;
                    case "chat":
                        if (!message.from) {
                            console.warn(
                                "Ignoring chat message with undefined 'from'"
                            );
                            return;
                        }
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: `${message.from}-${message.timestamp}`,
                                from: message.from,
                                message: message.message || "",
                                timestamp: message.timestamp || Date.now(),
                            },
                        ]);
                        break;
                    default:
                        console.log("Unhandled message type:", message.type);
                }
            } catch (err) {
                console.error("Error handling WebSocket message:", err);
            }
        };

        ws.addEventListener("message", messageHandler);

        return () => {
            ws.removeEventListener("message", messageHandler);
        };
    }, [ws, callId]);

    useEffect(() => {
        async function initializeCall() {
            try {
                console.log("Initializing call with:", {
                    callId,
                    peerEmail,
                    userEmail,
                });

                const localStream = await getLocalStream();

                const peerConnection = initializePeerConnection();

                if (localStream) {
                    localStream.getTracks().forEach((track) => {
                        peerConnection.addTrack(track, localStream);
                    });
                }

                if (userEmail < peerEmail) {
                    console.log("Creating offer as initiator");
                    createOffer();
                } else {
                    console.log("Waiting for offer as receiver");
                    setCallStatus("Waiting for connection...");
                }
            } catch (err) {
                console.error("Error initializing call:", err);
                setCallStatus("Failed to initialize call");
            }
        }

        if (userEmail && peerEmail && callId) {
            initializeCall();
        }

        return () => {
            endCall();
        };
    }, [userEmail, peerEmail, callId]);

    const sendMessage = () => {
        if (!ws || !newMessage.trim() || !userEmail) {
            console.warn("Cannot send message: missing WebSocket or userEmail");
            return;
        }

        const messageData = {
            type: "chat",
            from: userEmail,
            to: peerEmail,
            message: newMessage,
            callId,
            timestamp: Date.now(),
        };

        ws.send(JSON.stringify(messageData));
        setMessages((prev) => [
            ...prev,
            {
                id: `${messageData.timestamp}-${userEmail}`,
                from: userEmail,
                message: newMessage,
                timestamp: messageData.timestamp,
            },
        ]);
        setNewMessage("");
    };

    return (
        <View className="flex-1 bg-black">
            <View className="bg-gray-800 p-4">
                <Text className="text-white text-center text-lg font-semibold">
                    {callStatus}
                </Text>
                <Text className="text-gray-300 text-center text-sm">
                    Call with {peerEmail}
                </Text>
            </View>

            <View className="flex-1 flex-col">
                <View className="flex-1">
                    {remoteMediaStream ? (
                        <RTCView
                            streamURL={remoteMediaStream.toURL()}
                            style={{ flex: 1 }}
                            objectFit="cover"
                        />
                    ) : (
                        <View className="flex-1 justify-center items-center bg-gray-900">
                            <Text className="text-white text-center text-lg">
                                {isConnecting
                                    ? "Connecting to peer..."
                                    : "Waiting for remote video"}
                            </Text>
                        </View>
                    )}
                </View>

                {localMediaStream && (
                    <View className="flex-1 rounded-lg border-2 border-white">
                        <RTCView
                            mirror={true}
                            objectFit="cover"
                            streamURL={localMediaStream.toURL()}
                            style={{ flex: 1 }}
                        />
                    </View>
                )}
            </View>

            <View className="p-6 bg-gray-800 flex-row">
                <TouchableOpacity
                    className="bg-blue-500 py-4 px-8 rounded-full mx-auto"
                    onPress={() => setChatSectionStatus((prev) => !prev)}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        Chat
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-red-500 py-4 px-8 rounded-full mx-auto"
                    onPress={endCall}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        End Call
                    </Text>
                </TouchableOpacity>
            </View>

            {ChatSectionStatus && (
                <View className="absolute bottom-20 left-0 right-0 h-2/3 bg-gray-900/90 rounded-t-3xl p-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-lg font-semibold">
                            Chat with {peerEmail}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setChatSectionStatus(false)}
                        >
                            <Text className="text-white text-lg font-bold">
                                ✕
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        className="flex-1 mb-4"
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        {messages
                            .sort((a, b) => a.timestamp - b.timestamp)
                            .map((msg) => (
                                <View
                                    key={msg.id}
                                    className={`mb-2 p-3 rounded-lg max-w-[80%] ${
                                        msg.from === userEmail
                                            ? "bg-blue-500 ml-auto"
                                            : "bg-gray-700"
                                    }`}
                                >
                                    <Text className="text-white">
                                        {msg.message}
                                    </Text>
                                    <Text className="text-xs text-gray-300 mt-1">
                                        {new Date(
                                            msg.timestamp
                                        ).toLocaleTimeString()}
                                    </Text>
                                </View>
                            ))}
                    </ScrollView>
                    <View className="flex-row items-center">
                        <TextInput
                            className="flex-1 bg-gray-800 text-white p-3 rounded-full mr-2"
                            placeholder="Type a message..."
                            placeholderTextColor="#94a3b8"
                            value={newMessage}
                            onChangeText={setNewMessage}
                        />
                        <TouchableOpacity
                            className="bg-blue-500 p-3 rounded-full"
                            onPress={sendMessage}
                            disabled={!newMessage.trim()}
                        >
                            <Text className="text-white font-bold">Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

export default Communication;
