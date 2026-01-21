"use client";

import React, { useRef } from "react";
import { Play, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShortsRow() {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Mock data for "Shorts" - in real app, fetch from api.shorts.list
    const shorts = [
        { id: 1, title: "GOOLKA CAAWA!", views: "125K", color: "bg-gradient-to-br from-red-600 to-orange-600" },
        { id: 2, title: "Qosolka Adduunka", views: "45K", color: "bg-gradient-to-br from-blue-600 to-purple-600" },
        { id: 3, title: "TOP 5 SKILLS", views: "89K", color: "bg-gradient-to-br from-green-500 to-teal-600" },
        { id: 4, title: "Taageeraha!", views: "210K", color: "bg-gradient-to-br from-yellow-500 to-orange-600" },
        { id: 5, title: "Messi vs Ronaldo", views: "500K", color: "bg-gradient-to-br from-indigo-600 to-blue-800" },
        { id: 6, title: "Ciyaarta Berri", views: "30K", color: "bg-gradient-to-br from-pink-600 to-rose-600" },
        { id: 7, title: "Dabcasar Live", views: "12K", color: "bg-gradient-to-br from-slate-700 to-slate-900" },
    ];

    return (
        <section className="mb-8 pl-4">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-accent-red" size={20} />
                <h2 className="text-lg font-black text-white">CiyaarSnaps</h2>
                <span className="text-xs font-bold px-2 py-0.5 bg-accent-red/20 text-accent-red rounded ml-2 animate-pulse">LIVE</span>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 pr-4"
            >
                {shorts.map((item) => (
                    <div
                        key={item.id}
                        className="snap-start flex-shrink-0 w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-xl relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-200 border-2 border-transparent hover:border-white/50"
                    >
                        {/* Background (Gradient Placeholder or Image) */}
                        <div className={cn("absolute inset-0", item.color)}></div>

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-end p-2 md:p-3">
                            <div className="bg-white/20 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center mb-auto border border-white/20">
                                <Play size={12} fill="white" className="text-white ml-0.5" />
                            </div>

                            <h3 className="text-xs md:text-sm font-bold text-white leading-tight mb-1 line-clamp-2 drop-shadow-md">
                                {item.title}
                            </h3>
                            <p className="text-[10px] text-white/70 font-medium">
                                {item.views} Views
                            </p>
                        </div>
                    </div>
                ))}
                <div className="w-2 flex-shrink-0" />
            </div>
        </section>
    );
}
