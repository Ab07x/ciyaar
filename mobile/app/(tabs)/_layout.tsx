import { Tabs } from "expo-router";
import { Film, Home, Menu, Play, Tv } from "lucide-react-native";
import { Colors } from "../../constants/Colors";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.stadium.elevated,
                    borderTopColor: Colors.border.subtle,
                },
                tabBarActiveTintColor: Colors.accent.green,
                tabBarInactiveTintColor: Colors.text.muted,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="movies"
                options={{
                    title: "Movies",
                    tabBarIcon: ({ color, size }) => <Film size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="series"
                options={{
                    title: "Series",
                    tabBarIcon: ({ color, size }) => <Tv size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
