"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

// Global SWR fetcher
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SWRProvider({ children }: { children: ReactNode }) {
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
