
import React from "react";
import "@/app/globals.css";

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
            <div className="w-full h-full p-8 md:p-12 lg:p-16">
                {children}
            </div>
        </div>
    );
}
