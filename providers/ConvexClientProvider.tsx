"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

// Global SWR fetcher
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Replaces ConvexClientProvider with SWR config.
 * We keep the same component name so layout.tsx doesn't need to change the import.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher,
                revalidateOnFocus: false,
                dedupingInterval: 5000,
                errorRetryCount: 3,
            }}
        >
            {children}
        </SWRConfig>
    );
}
