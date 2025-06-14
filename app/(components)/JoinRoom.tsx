import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Button, TextInput, View } from "react-native";

const JoinRoom = () => {
    const [room, setRoom] = useState<string>("");

    const router = useRouter();
    const handleJoin = () => {
        router.push({
            pathname: "/Communication",
            params: {
                room: room,
            },
        });
    };

    return (
        <View className="flex-1 justify-center items-center">
            <TextInput
                placeholder="Room"
                onChange={(event) => setRoom(event.nativeEvent.text)}
                value={room}
            />
            <Button title="Join Room" onPress={handleJoin} />
        </View>
    );
};

export default JoinRoom;
