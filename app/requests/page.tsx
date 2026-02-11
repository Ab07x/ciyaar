"use client";

import { RequestForm } from "@/components/requests/RequestForm";
import { RequestList } from "@/components/requests/RequestList";
import { AdSlot } from "@/components/AdSlot";

export default function RequestsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">
                    Codso <span className="text-accent-green">Content</span>
                </h1>
                <p className="text-text-secondary max-w-xl mx-auto text-lg">
                    Ma weysay filim ama musalsal aad rabtay? Hoos ka codso, codsiga ugu codka (vote)
                    bata ayaa la soo gelin doonaa marka hore.
                </p>
            </div>

            <div className="mb-12">
                <RequestForm onRequestSubmitted={() => {
                    // Refetch handled by SWR
                }} />
            </div>

            <AdSlot slotKey="requests_top" className="mb-12" />

            <div className="bg-stadium-elevated/50 p-1 rounded-2xl">
                <RequestList />
            </div>
        </div>
    );
}
