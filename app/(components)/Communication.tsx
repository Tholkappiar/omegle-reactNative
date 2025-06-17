import { api } from "@/convex/_generated/api";
import {
    AudioSession,
    LiveKitRoom,
    TrackReferenceOrPlaceholder,
    VideoTrack,
    isTrackReference,
    useLocalParticipant,
    useRoomContext,
    useTracks,
} from "@livekit/react-native";
import { useAction, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { Track } from "livekit-client";
import { Camera, CameraOff, Mic, MicOff, PhoneOff } from "lucide-react-native";
import * as React from "react";
import { useEffect } from "react";
import {
    Alert,
    FlatList,
    ListRenderItem,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const wsURL = process.env.LIVEKIT_URL;

export default function App() {
    const { room } = useLocalSearchParams();

    const profile = useQuery(api.user.getProfile);
    const generateToken = useAction(
        api.livekitCommunication.generateLivekitToken
    );
    const [token, setToken] = React.useState<string>("");
    // Start the audio session first.
    useEffect(() => {
        let start = async () => {
            await AudioSession.startAudioSession();
        };

        start();
        return () => {
            AudioSession.stopAudioSession();
            console.log("audio stopped");
        };
    }, []);

    useEffect(() => {
        if (room && profile?._id) {
            generateToken({
                roomName: String(room),
                participantName: profile._id,
            })
                .then(setToken)
                .catch((err) => {
                    console.error("Token fetch failed", err);
                });
        }
    }, [room, profile?._id]);

    if (!token) {
        return (
            <View className="flex-1 justify-center items-center bg-black">
                <Text className="text-white text-lg">Loading token...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <LiveKitRoom
                serverUrl={wsURL}
                token={token}
                connect={true}
                options={{
                    // Use screen pixel density to handle screens with differing densities.
                    adaptiveStream: { pixelDensity: "screen" },
                }}
                audio={true}
                video={true}
                onConnected={() => {
                    console.log("Room connected successfully");
                }}
                onDisconnected={() => {
                    console.log("Room disconnected");
                }}
            >
                <RoomView />
            </LiveKitRoom>
        </View>
    );
}

const RoomView = () => {
    const tracks = useTracks([Track.Source.Camera]);
    const { localParticipant } = useLocalParticipant();
    const room = useRoomContext();

    const [isMicEnabled, setIsMicEnabled] = React.useState(true);
    const [isCameraEnabled, setIsCameraEnabled] = React.useState(true);

    const toggleMicrophone = async () => {
        try {
            if (localParticipant) {
                await localParticipant.setMicrophoneEnabled(!isMicEnabled);
                setIsMicEnabled(!isMicEnabled);
            }
        } catch (error) {
            console.error("Error toggling microphone:", error);
        }
    };

    const toggleCamera = async () => {
        try {
            if (localParticipant) {
                if (isCameraEnabled) {
                    const cameraPublication =
                        localParticipant.getTrackPublication(
                            Track.Source.Camera
                        );
                    if (cameraPublication && cameraPublication.track) {
                        await localParticipant.unpublishTrack(
                            cameraPublication.track
                        );
                        cameraPublication.pauseUpstream();
                    }
                    setIsCameraEnabled(false);
                } else {
                    try {
                        await localParticipant.setCameraEnabled(true);
                        setIsCameraEnabled(true);
                    } catch (error) {
                        console.error("Error enabling camera:", error);
                        Alert.alert(
                            "Error",
                            "Failed to enable camera. Please try again."
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Error toggling camera:", error);
        }
    };

    const handleLeaveMeeting = () => {
        Alert.alert(
            "Leave Meeting",
            "Are you sure you want to leave the meeting?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Leave",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (room) {
                                await room.disconnect();
                            }
                            router.replace("/(tabs)/JoinRoom");
                        } catch (error) {
                            console.error("Error leaving meeting:", error);
                            router.replace("/(tabs)/JoinRoom");
                        }
                    },
                },
            ]
        );
    };

    const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({
        item,
    }) => {
        if (isTrackReference(item)) {
            return (
                <VideoTrack
                    trackRef={item}
                    style={{ width: "100%", height: 300 }}
                />
            );
        } else {
            return (
                <View className="h-72 bg-gray-800 m-1 rounded-lg justify-center items-center">
                    <Text className="text-white text-base">No Video</Text>
                </View>
            );
        }
    };

    return (
        <View className="flex-1 bg-black">
            <View className="flex-1">
                <FlatList
                    data={tracks}
                    renderItem={renderTrack}
                    keyExtractor={(item, index) =>
                        isTrackReference(item)
                            ? `${item.participant.sid}-${item.publication?.trackSid}`
                            : `placeholder-${index}`
                    }
                />
            </View>
            <View className="flex-row justify-around items-center py-5 px-5 bg-gray-800 border-t border-gray-600">
                <TouchableOpacity
                    className={`items-center justify-center w-16 h-16 rounded-full mx-2 ${
                        isMicEnabled ? "bg-gray-600" : "bg-gray-500"
                    }`}
                    onPress={toggleMicrophone}
                >
                    <Text className="text-2xl mb-1 text-white">
                        {isMicEnabled ? (
                            <Mic className="text-white" />
                        ) : (
                            <MicOff />
                        )}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`items-center justify-center w-16 h-16 rounded-full mx-2 ${
                        isCameraEnabled ? "bg-gray-600" : "bg-gray-500"
                    }`}
                    onPress={toggleCamera}
                >
                    <Text className="text-2xl mb-1">
                        {isCameraEnabled ? <Camera /> : <CameraOff />}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="items-center justify-center w-16 h-16 rounded-full mx-2 bg-red-500"
                    onPress={handleLeaveMeeting}
                >
                    <PhoneOff />
                </TouchableOpacity>
            </View>
        </View>
    );
};
