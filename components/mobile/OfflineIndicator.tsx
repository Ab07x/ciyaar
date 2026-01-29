"use client";

import React from "react";
import { useOffline } from "@/hooks/useOffline";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Displays an offline indicator banner when the user loses connection
 */
export function OfflineIndicator() {
    const { isOffline, isOnline } = useOffline();

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 safe-top"
                >
                    <div className="bg-accent-red text-white px-4 py-3 flex items-center justify-center gap-2 shadow-lg">
                        <WifiOff size={20} />
                        <span className="font-semibold text-sm">
                            You're offline. Some features may not work.
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Displays a success banner when connection is restored
 */
export function OnlineIndicator() {
    const { isOnline } = useOffline();
    const [justCameOnline, setJustCameOnline] = React.useState(false);

    React.useEffect(() => {
        if (isOnline) {
            setJustCameOnline(true);
            const timer = setTimeout(() => setJustCameOnline(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    return (
        <AnimatePresence>
            {justCameOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 safe-top"
                >
                    <div className="bg-accent-green text-black px-4 py-3 flex items-center justify-center gap-2 shadow-lg">
                        <Wifi size={20} />
                        <span className="font-semibold text-sm">
                            You're back online
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Combined component
export function ConnectionIndicator() {
    return (
        <>
            <OfflineIndicator />
            <OnlineIndicator />
        </>
    );
}
