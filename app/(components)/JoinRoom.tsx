import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Button,
    NativeSyntheticEvent,
    TextInput,
    TextInputChangeEventData,
    View,
} from "react-native";

type JoinUserDetails = {
    room: string;
    token: string;
};

const JoinRoom = () => {
    const [joinDetails, setJoinDetails] = useState<JoinUserDetails>({
        token: "",
        room: "",
    });

    function handleInput(key: keyof JoinUserDetails) {
        return (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
            const value = event.nativeEvent.text;
            setJoinDetails((prev) => ({
                ...prev,
                [key]: value,
            }));
        };
    }
    const router = useRouter();
    const handleJoin = () => {
        router.push({
            pathname: "/Communication",
            params: {
                token: joinDetails.token,
            },
        });
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput
                placeholder="Room"
                onChange={handleInput("room")}
                value={joinDetails.room}
                style={{ marginBottom: 10, borderBottomWidth: 1 }}
            />
            <TextInput
                placeholder="token"
                onChange={handleInput("token")}
                value={joinDetails.token}
                style={{ marginBottom: 10, borderBottomWidth: 1 }}
            />
            <Button title="Join Room" onPress={handleJoin} />
        </View>
    );
};

export default JoinRoom;
