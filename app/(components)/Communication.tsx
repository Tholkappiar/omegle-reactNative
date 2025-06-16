import { api } from "@/convex/_generated/api";
import {
    AudioSession,
    LiveKitRoom,
    TrackReferenceOrPlaceholder,
    VideoTrack,
    isTrackReference,
    useTracks,
} from "@livekit/react-native";
import { useAction, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { Track } from "livekit-client";
import * as React from "react";
import { useEffect } from "react";
import { FlatList, ListRenderItem, StyleSheet, Text, View } from "react-native";

const wsURL = "wss://omegle-uarhh1wq.livekit.cloud";

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
            console.log("audio stoppped");
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
            <View>
                <Text>Loading token...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1">
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
            >
                <RoomView />
            </LiveKitRoom>
            <Text>This is the token : {token}</Text>
        </View>
    );
}

const RoomView = () => {
    // Get all camera tracks.
    const tracks = useTracks([Track.Source.Camera]);

    const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({
        item,
    }) => {
        // Render using the VideoTrack component.
        if (isTrackReference(item)) {
            return (
                <VideoTrack trackRef={item} style={styles.participantView} />
            );
        } else {
            return <View style={styles.participantView} />;
        }
    };

    return (
        <View style={styles.container}>
            <FlatList data={tracks} renderItem={renderTrack} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "stretch",
        justifyContent: "center",
    },
    participantView: {
        height: 300,
    },
});
