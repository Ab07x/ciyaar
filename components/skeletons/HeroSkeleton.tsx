"use client";

import { motion } from "framer-motion";

export function HeroSkeleton() {
    return (
        <div className="relative w-full h-[65vh] md:h-auto md:aspect-[21/9] lg:aspect-[2.4/1] bg-stadium-dark overflow-hidden rounded-2xl border border-border-subtle mb-12">
            {/* Background shimmer */}
            <div className="absolute inset-0 skeleton-shimmer" />

            {/* Content skeleton */}
            <div className="absolute inset-0 flex items-end md:items-center pb-12 md:pb-0">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="max-w-2xl space-y-4">
                        {/* Badges */}
                        <div className="flex gap-2">
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-20 h-6 bg-white/10 rounded-md"
                            />
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                                className="w-16 h-6 bg-white/10 rounded-md"
                            />
                        </div>

                        {/* Title */}
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-3/4 h-12 md:h-16 bg-white/10 rounded-lg"
                        />

                        {/* Overview */}
                        <div className="space-y-2">
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                className="w-full h-4 bg-white/10 rounded"
                            />
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                className="w-5/6 h-4 bg-white/10 rounded"
                            />
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                className="w-2/3 h-4 bg-white/10 rounded"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-2">
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                                className="w-40 h-12 bg-white/10 rounded-xl"
                            />
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
                                className="w-32 h-12 bg-white/10 rounded-xl hidden md:block"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                        className={`h-2 rounded-full bg-white/20 ${i === 0 ? 'w-8' : 'w-2'}`}
                    />
                ))}
            </div>
        </div>
    );
}
