import { useAuthActions } from "@convex-dev/auth/react";
import { Pressable, Text, View } from "react-native";
import Communication from "./(components)/Communication";

export default function Index() {
    const { signOut } = useAuthActions();
    return (
        <View className="flex-1">
            <Communication />
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
