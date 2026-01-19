import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ConvexProvider } from "convex/react";
import { convex } from "../utils/convex";
import { Colors } from "../constants/Colors";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    return (
        <ConvexProvider client={convex}>
            <SafeAreaProvider>
                <ThemeProvider value={DarkTheme}>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    </Stack>
                    <StatusBar style="light" backgroundColor={Colors.stadium.dark} />
                </ThemeProvider>
            </SafeAreaProvider>
        </ConvexProvider>
    );
}
