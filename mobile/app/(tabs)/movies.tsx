import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Stack } from "expo-router";

export default function MoviesScreen() {
    const movies = useQuery(api.movies.listMovies, { isPublished: true });

    if (!movies) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.stadium.dark, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={Colors.accent.green} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.stadium.dark }}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ padding: 16 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
                    Hindi Af Somali
                </Text>
                <FlatList
                    data={movies}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
                    columnWrapperStyle={{ gap: 16 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.stadium.elevated, borderRadius: 12, overflow: "hidden" }}>
                            <Image
                                source={{ uri: item.posterUrl }}
                                style={{ width: "100%", aspectRatio: 2 / 3, backgroundColor: Colors.stadium.hover }}
                            />
                            <View style={{ padding: 10 }}>
                                <Text numberOfLines={1} style={{ color: Colors.text.primary, fontWeight: "bold", fontSize: 14 }}>
                                    {item.title}
                                </Text>
                                <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 4 }}>
                                    {item.releaseDate?.split("-")[0]}
                                </Text>
                            </View>
                            {item.isPremium && (
                                <View style={{ position: "absolute", top: 8, left: 8, backgroundColor: Colors.accent.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                    <Text style={{ color: "black", fontSize: 10, fontWeight: "bold" }}>PREMIUM</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}
