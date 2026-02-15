
import React from "react";
import "@/app/globals.css";
import TVBottomNav from "@/components/tv/TVBottomNav";

export const metadata = {
    title: "Ciyaar TV",
    description: "Experience Ciyaar on the big screen.",
};

export default function TVLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
            {/* TV Layout might have specific safe/overscan areas */}
            <div className="w-full h-full p-8 pb-28 md:p-12 md:pb-32 lg:p-16 lg:pb-36">
                {children}
            </div>
            <TVBottomNav />
        </div>
    );
}
