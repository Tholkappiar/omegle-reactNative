import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import {
    DarkTheme,
    DefaultTheme,
    Theme,
    ThemeProvider,
} from "@react-navigation/native";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AuthForm from "./(auth)/AuthForm";
import "./global.css";

const LIGHT_THEME: Theme = {
    ...DefaultTheme,
    colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
    ...DarkTheme,
    colors: NAV_THEME.dark,
};

const convex = new ConvexReactClient(
    "https://precious-axolotl-250.convex.cloud",
    {
        unsavedChangesWarning: false,
    }
);

const secureStorage = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
};

function AppNavigator() {
    const hasMounted = React.useRef(false);
    const { colorScheme, isDarkColorScheme } = useColorScheme();
    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
    const { isAuthenticated, isLoading } = useConvexAuth();

    useIsomorphicLayoutEffect(() => {
        if (hasMounted.current) {
            return;
        }

        if (Platform.OS === "web") {
            // Adds the background color to the html element to prevent white background on overscroll.
            document.documentElement.classList.add("bg-background");
        }
        setIsColorSchemeLoaded(true);
        hasMounted.current = true;
    }, []);

    if (!isColorSchemeLoaded) {
        return null;
    }

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
    return (
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
            <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
            </Stack>
        </ThemeProvider>
    );
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

const useIsomorphicLayoutEffect =
    Platform.OS === "web" && typeof window === "undefined"
        ? React.useEffect
        : React.useLayoutEffect;
