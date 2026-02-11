"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
    Search,
    TrendingUp,
    AlertCircle,
    MousePointer,
    Users,
    BarChart3,
    Clock,
    ChevronLeft,
    Filter,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminSearchAnalyticsPage() {
    const [days, setDays] = useState(7);

    const { data: summary } = useSWR(`/api/search-analytics?action=summary&days=${days}`, fetcher);
    const { data: topQueries } = useSWR(`/api/search-analytics?action=topQueries&days=${days}&limit=20`, fetcher);
    const { data: zeroResultQueries } = useSWR(`/api/search-analytics?action=zeroResults&days=${days}&limit=20`, fetcher);
    const { data: recentSearches } = useSWR(`/api/search-analytics?action=recent&limit=30`, fetcher);
    const { data: trendData } = useSWR(`/api/search-analytics?action=trend&days=${days}`, fetcher);

    const isLoading = summary === undefined;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/kism" className="p-2 bg-stadium-elevated rounded-lg hover:bg-stadium-hover">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            <Search className="text-accent-green" />
                            Search Analytics
                        </h1>
                        <p className="text-text-muted text-sm mt-1">
                            Understand what your users are looking for
                        </p>
                    </div>
                </div>

                {/* Time Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-text-muted" />
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="bg-stadium-elevated border border-border-strong rounded-lg px-4 py-2 text-sm"
                    >
                        <option value={1}>Last 24 hours</option>
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                    </select>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    icon={<Search size={20} />}
                    label="Total Searches"
                    value={summary?.totalSearches ?? "-"}
                    color="text-accent-green"
                    loading={isLoading}
                />
                <StatCard
                    icon={<AlertCircle size={20} />}
                    label="Zero Results"
                    value={summary?.zeroResultSearches ?? "-"}
                    subValue={`${summary?.zeroResultRate ?? 0}%`}
                    color="text-red-400"
                    loading={isLoading}
                />
                <StatCard
                    icon={<MousePointer size={20} />}
                    label="Clicked"
                    value={summary?.clickedSearches ?? "-"}
                    subValue={`${summary?.clickThroughRate ?? 0}% CTR`}
                    color="text-blue-400"
                    loading={isLoading}
                />
                <StatCard
                    icon={<Users size={20} />}
                    label="Unique Devices"
                    value={summary?.uniqueDevices ?? "-"}
                    color="text-purple-400"
                    loading={isLoading}
                />
                <StatCard
                    icon={<Clock size={20} />}
                    label="Period"
                    value={`${days} days`}
                    color="text-text-muted"
                    loading={false}
                />
            </div>

            {/* Trend Chart */}
            {trendData && trendData.length > 0 && (
                <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-accent-green" />
                        Search Trend
                    </h2>
                    <div className="h-32 flex items-end gap-1">
                        {trendData.map((day: any, i: number) => {
                            const maxSearches = Math.max(...trendData.map((d: any) => d.searches));
                            const height = maxSearches > 0 ? (day.searches / maxSearches) * 100 : 0;
                            return (
                                <div
                                    key={day.date}
                                    className="flex-1 flex flex-col items-center gap-1"
                                >
                                    <div
                                        className="w-full bg-accent-green/80 rounded-t transition-all"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                        title={`${day.date}: ${day.searches} searches`}
                                    />
                                    <span className="text-[10px] text-text-muted truncate">
                                        {day.date.split("-").slice(1).join("/")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Search Queries */}
                <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-accent-green" />
                        Top Search Queries
                    </h2>
                    {!topQueries ? (
                        <div className="text-center py-8 text-text-muted">Loading...</div>
                    ) : topQueries.length === 0 ? (
                        <div className="text-center py-8 text-text-muted">
                            <Search size={32} className="mx-auto mb-2 opacity-30" />
                            <p>No search data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {topQueries.map((item: any, i: number) => (
                                <div
                                    key={item.query}
                                    className="flex items-center gap-3 p-3 bg-stadium-dark rounded-xl"
                                >
                                    <span className="w-6 h-6 rounded bg-accent-green/20 text-accent-green text-xs font-bold flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.query}</p>
                                        <div className="flex gap-4 text-xs text-text-muted mt-0.5">
                                            <span>{item.count} searches</span>
                                            <span className="text-blue-400">{item.clicks} clicks</span>
                                            {item.noResults > 0 && (
                                                <span className="text-red-400">{item.noResults} no results</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-accent-green">
                                            {item.count > 0 ? Math.round((item.clicks / item.count) * 100) : 0}% CTR
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Zero Result Queries (Content Gaps) */}
                <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-red-400" />
                        Content Gaps (Zero Results)
                    </h2>
                    <p className="text-sm text-text-muted mb-4">
                        Users searched for these but found nothing. Consider adding this content!
                    </p>
                    {!zeroResultQueries ? (
                        <div className="text-center py-8 text-text-muted">Loading...</div>
                    ) : zeroResultQueries.length === 0 ? (
                        <div className="text-center py-8 text-text-muted">
                            <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                            <p>No zero-result searches 🎉</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {zeroResultQueries.map((item: any, i: number) => (
                                <div
                                    key={item.query}
                                    className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                                >
                                    <span className="w-6 h-6 rounded bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate text-red-200">{item.query}</p>
                                    </div>
                                    <span className="text-xs font-bold text-red-400">
                                        {item.count}x
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Searches */}
            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-text-muted" />
                    Recent Searches
                </h2>
                {!recentSearches ? (
                    <div className="text-center py-8 text-text-muted">Loading...</div>
                ) : recentSearches.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No searches recorded yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border-subtle">
                                    <th className="text-left py-2 px-3 text-text-muted font-medium">Query</th>
                                    <th className="text-center py-2 px-3 text-text-muted font-medium">Results</th>
                                    <th className="text-left py-2 px-3 text-text-muted font-medium">Clicked</th>
                                    <th className="text-right py-2 px-3 text-text-muted font-medium">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSearches.map((search: any) => (
                                    <tr key={search.id || search._id} className="border-b border-border-subtle/50 hover:bg-stadium-hover">
                                        <td className="py-2 px-3 font-medium">{search.query}</td>
                                        <td className="py-2 px-3 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-bold ${search.hasResults
                                                    ? "bg-accent-green/20 text-accent-green"
                                                    : "bg-red-500/20 text-red-400"
                                                    }`}
                                            >
                                                {search.resultsCount}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3">
                                            {search.clickedItem ? (
                                                <span className="text-blue-400">
                                                    {search.clickedItemType}: {search.clickedItem}
                                                </span>
                                            ) : (
                                                <span className="text-text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-3 text-right text-text-muted">
                                            {new Date(search.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h3 className="font-bold text-blue-400 mb-2">How Search Analytics Works</h3>
                <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Searches are tracked 1 second after users stop typing (debounced)</li>
                    <li>• Click-through is tracked when users select a search result</li>
                    <li>• &quot;Content Gaps&quot; shows what users searched for but didn&apos;t find</li>
                    <li>• Use this data to improve your content catalog</li>
                    <li>• High zero-result rate = opportunity to add popular content</li>
                </ul>
            </div>
        </div>
    );
}

// Helper component for stat cards
function StatCard({
    icon,
    label,
    value,
    subValue,
    color,
    loading,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
    loading: boolean;
}) {
    return (
        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <div className={color}>{icon}</div>
                <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
            </div>
            {loading ? (
                <div className="h-8 w-16 bg-stadium-hover rounded animate-pulse" />
            ) : (
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black">{value}</span>
                    {subValue && <span className="text-sm text-text-muted">{subValue}</span>}
                </div>
            )}
        </div>
    );
}
