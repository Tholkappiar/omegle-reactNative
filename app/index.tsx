import { useAuthActions } from "@convex-dev/auth/react";
import { Pressable, Text, View } from "react-native";
import JoinRoom from "./(components)/JoinRoom";

export default function Index() {
    const { signOut } = useAuthActions();

    return (
        <View className="flex-1">
            <JoinRoom />
            <Pressable
                onPress={signOut}
                className="p-2 rounded-lg bg-red-500 w-24 m-2"
            >
                <Text className="text-center text-white font-bold">
                    Sign out
                </Text>
            </Pressable>
        </View>
    );
}
