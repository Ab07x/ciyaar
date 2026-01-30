
import { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Crown, Star } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface MovieHeroProps {
    movie: Doc<"movies">;
}

export function MovieHero({ movie }: MovieHeroProps) {
    const { t } = useLanguage();

    if (!movie) return null;

    return (
        <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 transition-opacity duration-1000">
                <Image
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover opacity-50 mix-blend-overlay"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-stadium-dark via-stadium-dark/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-stadium-dark via-transparent to-stadium-dark/20" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-stadium-dark to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="max-w-2xl space-y-4 md:space-y-6">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <span className="px-3 py-1 bg-accent-green text-black text-xs md:text-sm font-bold rounded">
                                AF-SOMALI
                            </span>
                            {movie.isPremium && (
                                <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs md:text-sm font-bold rounded flex items-center gap-1">
                                    <Crown size={12} /> PREMIUM
                                </span>
                            )}
                            {movie.rating && (
                                <span className="flex items-center gap-1 text-yellow-400 text-xs md:text-sm font-bold">
                                    <Star size={14} fill="currentColor" /> {movie.rating.toFixed(1)}
                                </span>
                            )}
                            <span className="text-white/60 text-xs md:text-sm">
                                {new Date(movie.releaseDate).getFullYear()}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight">
                            {movie.title}
                        </h2>

                        {/* Genres */}
                        {movie.genres && movie.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {movie.genres.slice(0, 4).map((genre: string) => (
                                    <span
                                        key={genre}
                                        className="text-white/70 text-sm border-r border-white/30 pr-2 last:border-0"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Overview */}
                        <p className="text-white/80 text-sm md:text-lg line-clamp-3 max-w-xl">
                            {movie.overview}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 md:gap-4 pt-2">
                            <Link
                                href={`/movies/${movie.slug || movie._id}`}
                                className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white hover:bg-white/90 text-black font-bold rounded-lg text-sm md:text-lg transition-all"
                            >
                                <Play fill="currentColor" size={20} />
                                DAAMO
                            </Link>
                            <Link
                                href={`/movies/${movie.slug || movie._id}`}
                                className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold rounded-lg text-sm md:text-lg transition-all"
                            >
                                <Info size={20} />
                                FAHFAAHIN
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
