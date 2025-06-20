import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
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

type SearchParams = {
    remoteUserId?: string;
};

// Define interface for WebSocket messages
interface WebSocketMessage {
    type: "register" | "offer" | "answer" | "candidate";
    from: string;
    to: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

const Communication = () => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isFront, setIsFront] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const ws = useRef<WebSocket | null>(null);

    const profile = useQuery(api.user.getProfile);
    const { remoteUserId = "" } = useLocalSearchParams<SearchParams>();

    const participantProfile = useQuery(api.user.getParticipantProfile, {
        email: remoteUserId,
    });

    const configuration: RTCConfiguration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    // Request permissions
    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS === "android") {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);

                const cameraGranted =
                    granted[PermissionsAndroid.PERMISSIONS.CAMERA] ===
                    PermissionsAndroid.RESULTS.GRANTED;
                const audioGranted =
                    granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
                    PermissionsAndroid.RESULTS.GRANTED;

                return cameraGranted && audioGranted;
            } catch (err) {
                console.error("Permission request error:", err);
                return false;
            }
        }
        return true;
    };

    // Get local media stream
    const getLocalStream = async (): Promise<MediaStream | null> => {
        try {
            const hasPermissions = await requestPermissions();
            if (!hasPermissions) {
                setError("Camera or microphone permission denied");
                return null;
            }

            const constraints = {
                audio: true,
                video: {
                    width: 640,
                    height: 480,
                    frameRate: 30,
                    facingMode: isFront ? "user" : "environment",
                },
            };

            const stream = await mediaDevices.getUserMedia(constraints);
            console.log(
                "Got local stream with tracks:",
                stream.getTracks().length
            );
            return stream;
        } catch (err) {
            console.error("Error getting local stream:", err);
            setError("Failed to access camera/microphone");
            return null;
        }
    };

    // Initialize WebRTC
    const initializeWebRTC = async () => {
        try {
            // Get local stream first
            const stream = await getLocalStream();
            if (!stream) return;

            setLocalStream(stream);
            setIsStreaming(true);

            // Create peer connection
            peerConnection.current = new RTCPeerConnection(configuration);

            // Add local stream tracks to peer connection
            stream.getTracks().forEach((track) => {
                peerConnection.current?.addTrack(track, stream);
            });

            // Handle ICE candidates
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate && ws.current) {
                    const message: WebSocketMessage = {
                        type: "candidate",
                        from: String(profile?._id),
                        to: String(participantProfile?._id),
                        candidate: event.candidate.toJSON(),
                    };
                    ws.current.send(JSON.stringify(message));
                }
            };

            // Handle remote stream
            peerConnection.current.ontrack = (event) => {
                console.log("Received remote stream");
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                }
            };

            // Initialize WebSocket
            initializeWebSocket();
        } catch (err) {
            console.error("WebRTC initialization error:", err);
            setError("Failed to initialize WebRTC");
        }
    };

    // Initialize WebSocket
    const initializeWebSocket = () => {
        try {
            ws.current = new WebSocket(
                "ws://signaling-server-vl35.onrender.com"
            );

            ws.current.onopen = async () => {
                console.log("WebSocket connected");

                // Register user
                const registerMsg: WebSocketMessage = {
                    type: "register",
                    from: String(profile?._id),
                    to: "",
                };
                ws.current?.send(JSON.stringify(registerMsg));

                // Create and send offer
                if (peerConnection.current) {
                    try {
                        const offer =
                            await peerConnection.current.createOffer();
                        await peerConnection.current.setLocalDescription(offer);

                        const offerMsg: WebSocketMessage = {
                            type: "offer",
                            from: String(profile?._id),
                            to: String(participantProfile?._id),
                            sdp: offer,
                        };
                        ws.current?.send(JSON.stringify(offerMsg));
                    } catch (err) {
                        console.error("Error creating offer:", err);
                    }
                }
            };

            ws.current.onmessage = async (event: WebSocketMessageEvent) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    console.log("Received WebSocket message:", message.type);

                    if (
                        message.from === String(profile?._id) ||
                        !peerConnection.current
                    )
                        return;

                    switch (message.type) {
                        case "offer":
                            await handleOffer(message);
                            break;
                        case "answer":
                            await handleAnswer(message);
                            break;
                        case "candidate":
                            await handleCandidate(message);
                            break;
                    }
                } catch (err) {
                    console.error("WebSocket message error:", err);
                }
            };

            ws.current.onerror = (err) => {
                console.error("WebSocket error:", err);
                setError("WebSocket connection failed");
            };

            ws.current.onclose = () => {
                console.log("WebSocket closed");
            };
        } catch (err) {
            console.error("WebSocket initialization error:", err);
            setError("Failed to connect to signaling server");
        }
    };

    const handleOffer = async (message: WebSocketMessage) => {
        if (!peerConnection.current) return;
        try {
            await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(message.sdp!)
            );
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            const answerMsg: WebSocketMessage = {
                type: "answer",
                from: String(profile?._id),
                to: message.from,
                sdp: answer,
            };
            ws.current?.send(JSON.stringify(answerMsg));
        } catch (err) {
            console.error("Error handling offer:", err);
        }
    };

    const handleAnswer = async (message: WebSocketMessage) => {
        if (!peerConnection.current) return;
        try {
            await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(message.sdp!)
            );
        } catch (err) {
            console.error("Error handling answer:", err);
        }
    };

    const handleCandidate = async (message: WebSocketMessage) => {
        if (!peerConnection.current || !message.candidate) return;
        try {
            await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(message.candidate)
            );
        } catch (err) {
            console.error("Error handling candidate:", err);
        }
    };

    // Switch camera
    const switchCamera = async () => {
        try {
            // Stop current stream
            if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
            }

            // Toggle camera
            setIsFront(!isFront);

            // Get new stream with opposite camera
            const constraints = {
                audio: true,
                video: {
                    width: 640,
                    height: 480,
                    frameRate: 30,
                    facingMode: !isFront ? "user" : "environment",
                },
            };

            const newStream = await mediaDevices.getUserMedia(constraints);
            setLocalStream(newStream);

            // Replace tracks in peer connection
            if (peerConnection.current) {
                const videoTrack = newStream.getVideoTracks()[0];
                const sender = peerConnection.current
                    .getSenders()
                    .find((s) => s.track && s.track.kind === "video");
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
            }
        } catch (err) {
            console.error("Error switching camera:", err);
            setError("Failed to switch camera");
        }
    };

    // Cleanup function
    const cleanup = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        setLocalStream(null);
        setRemoteStream(null);
        setIsStreaming(false);
        setError(null);
    };

    useEffect(() => {
        initializeWebRTC();
        return cleanup;
    }, [profile?._id, participantProfile?._id]);

    return (
        <View className="flex-1 bg-black p-4">
            <Text className="text-white text-2xl mb-4 text-center">
                Video Call
            </Text>
            {error && (
                <Text className="text-red-500 mb-4 text-center">{error}</Text>
            )}

            <View className="flex-1 flex-row justify-between">
                {/* Local Video */}
                <View className="w-[48%] h-[300px] border-2 border-white rounded-lg overflow-hidden">
                    {localStream && (
                        <RTCView
                            streamURL={localStream.toURL()}
                            style={styles.video}
                            objectFit="cover"
                            mirror={isFront}
                        />
                    )}
                    {!localStream && (
                        <View className="flex-1 justify-center items-center bg-gray-700">
                            <Text className="text-white text-base">
                                Local Video
                            </Text>
                        </View>
                    )}
                </View>

                {/* Remote Video */}
                <View className="w-[48%] h-[300px] border-2 border-white rounded-lg overflow-hidden">
                    {remoteStream && (
                        <RTCView
                            streamURL={remoteStream.toURL()}
                            style={styles.video}
                            objectFit="cover"
                        />
                    )}
                    {!remoteStream && (
                        <View className="flex-1 justify-center items-center bg-gray-700">
                            <Text className="text-white text-base">
                                Remote Video
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <TouchableOpacity
                className="mt-4 bg-blue-500 p-3 rounded-lg items-center"
                onPress={switchCamera}
            >
                <Text className="text-white text-lg font-bold">
                    Switch Camera
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    video: {
        width: "100%",
        height: "100%",
    },
});

export default Communication;
