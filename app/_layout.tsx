import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AuthForm from "./(auth)/AuthForm";
import "./global.css";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    unsavedChangesWarning: false,
});

const secureStorage = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
};

function AppNavigator() {
    const { isAuthenticated, isLoading } = useConvexAuth();

    console.log("Authentication status:", { isAuthenticated, isLoading });

    // Show loading screen while checking authentication
    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Text>Loading...</Text>
            </View>
        );
    }

    // If not authenticated, show auth form directly
    if (!isAuthenticated) {
        return <AuthForm />;
    }

    // If authenticated, show the main app navigation
    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ConvexAuthProvider
                client={convex}
                storage={
                    Platform.OS === "android" || Platform.OS === "ios"
                        ? secureStorage
                        : undefined
                }
            >
                <SafeAreaView className="flex-1">
                    <AppNavigator />
                </SafeAreaView>
            </ConvexAuthProvider>
        </SafeAreaProvider>
    );
}
