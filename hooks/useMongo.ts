import useSWR, { SWRConfiguration } from "swr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * SWR-based query hook for fetching data from API endpoints.
 * Usage: const movies = useMongoQuery('/api/movies?isPublished=true');
 */
export function useMongoQuery<T = unknown>(
    url: string | null,
    options?: SWRConfiguration
) {
    const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 5000,
        ...options,
    });

    return { data: data ?? undefined, error, isLoading, mutate };
}

/**
 * Mutation hook for POST/PUT/DELETE requests to API endpoints.
 * Usage: const { trigger } = useMongoMutation('/api/movies', 'POST');
 */
export function useMongoMutation<TBody = unknown, TResult = unknown>(
    url: string,
    method: "POST" | "PUT" | "DELETE" = "POST"
) {
    const trigger = async (body?: TBody): Promise<TResult> => {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `${method} ${url} failed`);
        }

        return res.json();
    };

    return { trigger };
}

/**
 * Helper to build query string from params object.
 * Usage: buildQuery('/api/movies', { isPublished: true, limit: 10 })
 * Returns: '/api/movies?isPublished=true&limit=10'
 */
export function buildQuery(
    base: string,
    params: Record<string, string | number | boolean | undefined | null>
) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
        }
    });
    const qs = searchParams.toString();
    return qs ? `${base}?${qs}` : base;
}
