"use client";

import useSWR from "swr";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminRequestsPage() {
    const { data: requests, mutate } = useSWR("/api/requests?limit=100", fetcher);

    const handleUpdateStatus = async (id: string, status: string) => {
        await fetch("/api/requests", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
        mutate();
    };

    const statusColors: Record<string, string> = {
        pending: "text-yellow-400",
        approved: "text-accent-green",
        rejected: "text-accent-red",
        completed: "text-blue-400",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black">REQUESTS</h1>
                <p className="text-text-muted">User content requests and feedback</p>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-dark border-b border-border-strong">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Content</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Votes</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Date</th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests?.map((req: any) => (
                            <tr key={req._id} className="border-b border-border-subtle last:border-0 hover:bg-stadium-hover/50">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{req.title || req.contentTitle}</div>
                                    {req.description && (
                                        <p className="text-xs text-text-muted truncate max-w-xs">{req.description}</p>
                                    )}
                                </td>
                                <td className="px-4 py-3 capitalize text-sm">{req.contentType || req.type || "—"}</td>
                                <td className="px-4 py-3 text-sm">{req.votes || req.voteCount || 0}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-sm font-bold capitalize ${statusColors[req.status] || ""}`}>
                                        {req.status || "pending"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-text-muted">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => handleUpdateStatus(req._id, "approved")}
                                            className="p-1.5 hover:bg-accent-green/20 rounded text-text-muted hover:text-accent-green"
                                            title="Approve"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(req._id, "rejected")}
                                            className="p-1.5 hover:bg-red-500/20 rounded text-text-muted hover:text-red-500"
                                            title="Reject"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(req._id, "completed")}
                                            className="p-1.5 hover:bg-blue-500/20 rounded text-text-muted hover:text-blue-400"
                                            title="Mark Done"
                                        >
                                            <Clock size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!requests || requests.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                                    No content requests yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
