import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function HomeScreen() {
    // We can use the same queries as web!
    const movies = useQuery(api.movies.listMovies, { isPublished: true, limit: 5 });
    const series = useQuery(api.series.listSeries, { isPublished: true, limit: 5 });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.stadium.dark }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
                    Fanbroj <Text style={{ color: Colors.accent.green }}>Mobile</Text>
                </Text>

                <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                    Latest Movies
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                    {movies?.map((movie) => (
                        <TouchableOpacity key={movie._id} style={{ marginRight: 12, width: 140 }}>
                            <Image
                                source={{ uri: movie.posterUrl }}
                                style={{ width: 140, height: 210, borderRadius: 8, backgroundColor: Colors.stadium.elevated }}
                            />
                            <Text numberOfLines={1} style={{ color: Colors.text.primary, marginTop: 8, fontWeight: "600" }}>
                                {movie.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                    Latest Series
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {series?.map((s) => (
                        <TouchableOpacity key={s._id} style={{ marginRight: 12, width: 140 }}>
                            <Image
                                source={{ uri: s.posterUrl }}
                                style={{ width: 140, height: 210, borderRadius: 8, backgroundColor: Colors.stadium.elevated }}
                            />
                            <Text numberOfLines={1} style={{ color: Colors.text.primary, marginTop: 8, fontWeight: "600" }}>
                                {s.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </ScrollView>
        </SafeAreaView>
    );
}
