"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/providers/ToastProvider";

export default function AdminRequests() {
    const requests = useQuery(api.requests.listRequests, { limit: 100 });
    const updateStatus = useMutation(api.requests.updateRequestStatus);
    const toast = useToast();
    const [adminPass, setAdminPass] = useState("");

    const handleUpdate = async (id: any, status: any) => {
        if (!adminPass) {
            toast("Enter admin password first", "error");
            return;
        }
        try {
            await updateStatus({ requestId: id, status, adminPass });
            toast(`Request updated to ${status}`, "success");
        } catch (error) {
            toast("Failed to update status", "error");
        }
    };

    if (!requests) return <div className="p-8 text-center text-white">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6 text-white">Request Management</h1>

            <input
                type="password"
                placeholder="Admin Password"
                className="bg-black/20 border border-white/10 rounded px-4 py-2 mb-6 text-white"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
            />

            <div className="space-y-4">
                {requests.map((req) => (
                    <div key={req._id} className="bg-stadium-elevated p-4 rounded-lg flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-16 bg-black rounded overflow-hidden relative border border-white/10">
                                {req.posterUrl && <Image src={req.posterUrl} alt={req.title} fill className="object-cover" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{req.title}</h3>
                                <div className="text-sm text-gray-400 capitalize">{req.type} • {req.votes} Votes</div>
                                <div className={`text-xs mt-1 font-bold ${req.status === 'pending' ? 'text-yellow-500' :
                                        req.status === 'fulfilled' ? 'text-green-500' :
                                            req.status === 'rejected' ? 'text-red-500' : 'text-blue-500'
                                    }`}>
                                    {req.status?.toUpperCase() || "PENDING"}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {req.status !== "fulfilled" && (
                                <button
                                    onClick={() => handleUpdate(req._id, "fulfilled")}
                                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded transition-colors"
                                    title="Mark Fulfilled"
                                >
                                    <CheckCircle2 size={20} />
                                </button>
                            )}
                            {req.status === "pending" && (
                                <button
                                    onClick={() => handleUpdate(req._id, "rejected")}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded transition-colors"
                                    title="Reject"
                                >
                                    <XCircle size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
