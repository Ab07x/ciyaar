"use client";

import useSWR from "swr";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// SWR config for movie data - aggressive caching
const movieSwrConfig = {
    revalidateOnFocus: false, // Don't refetch when window gains focus
    revalidateIfStale: false, // Use stale data until revalidation
    dedupingInterval: 60000, // Dedupe requests within 1 minute
};

/**
 * Hook for fetching movies list with SWR caching
 * Reduces Convex bandwidth by using cached API endpoint
 */
export function useCachedMovies(options: {
    isPublished?: boolean;
    limit?: number;
    featured?: boolean;
    top10?: boolean;
} = {}) {
    const params = new URLSearchParams();

    if (options.isPublished !== undefined) {
        params.set("isPublished", String(options.isPublished));
    }
    if (options.limit) {
        params.set("limit", String(options.limit));
    }
    if (options.featured) {
        params.set("featured", "true");
    }
    if (options.top10) {
        params.set("top10", "true");
    }

    const url = `/api/movies?${params.toString()}`;

    const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
        ...movieSwrConfig,
        revalidateOnMount: true,
    });

    return {
        movies: data as any[] | undefined,
        isLoading,
        isError: !!error,
        mutate,
    };
}

/**
 * Hook for fetching single movie with SWR caching
 */
export function useCachedMovie(slug: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        slug ? `/api/movies/${slug}` : null,
        fetcher,
        movieSwrConfig
    );

    return {
        movie: data as any | undefined,
        isLoading,
        isError: !!error,
        mutate,
    };
}

/**
 * Hook for featured movies
 */
export function useFeaturedMovies() {
    return useCachedMovies({ featured: true });
}

/**
 * Hook for top 10 movies
 */
export function useTop10Movies() {
    return useCachedMovies({ top10: true });
}
