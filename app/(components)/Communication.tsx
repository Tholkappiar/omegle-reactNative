import {
    AudioSession,
    LiveKitRoom,
    TrackReferenceOrPlaceholder,
    VideoTrack,
    isTrackReference,
    registerGlobals,
    useTracks,
} from "@livekit/react-native";
import { useLocalSearchParams } from "expo-router";
import { Track } from "livekit-client";
import * as React from "react";
import { useEffect } from "react";
import { FlatList, ListRenderItem, StyleSheet, View } from "react-native";

registerGlobals();

// !! Note !!
// This sample hardcodes a token which expires in 2 hours.
const wsURL = "wss://omegle-uarhh1wq.livekit.cloud";
const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDk4OTI2ODcsImlzcyI6IkFQSWRDeHlmTkJkaGlZdiIsIm5iZiI6MTc0OTg4NTQ4Nywic3ViIjoicXVpY2tzdGFydCB1c2VyIG5qaTdpNCIsInZpZGVvIjp7ImNhblB1Ymxpc2giOnRydWUsImNhblB1Ymxpc2hEYXRhIjp0cnVlLCJjYW5TdWJzY3JpYmUiOnRydWUsInJvb20iOiJxdWlja3N0YXJ0IHJvb20iLCJyb29tSm9pbiI6dHJ1ZX19.QhVQ9HuWIDdHBEDIU_N_v8VIGqUprjkTQfXYhhDGmBM";

type JoinUserDetails = {
    room: string;
    token: string;
};

export default function App() {
    // Start the audio session first.
    useEffect(() => {
        let start = async () => {
            await AudioSession.startAudioSession();
        };

        start();
        return () => {
            AudioSession.stopAudioSession();
        };
    }, []);

    const { token } = useLocalSearchParams();

    return (
        <LiveKitRoom
            serverUrl={wsURL}
            token={String(token)}
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
