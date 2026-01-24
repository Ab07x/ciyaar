"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon, Sparkles, Monitor, Square, MessageSquareMore, Maximize, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";

export default function AdminBannersPage() {
    const router = useRouter();
    const banners = useQuery(api.promoBanners.getAllBanners);
    const deleteBanner = useMutation(api.promoBanners.deleteBanner);
    const updateBanner = useMutation(api.promoBanners.updateBanner);
    const seedBanner = useMutation(api.promoBanners.seedDefaultBanner);
    const seedBannerByType = useMutation(api.promoBanners.seedBannerByType);

    // Get current active banners for each type
    const activeMain = useQuery(api.promoBanners.getActiveBanner, { type: "main" });
    const activeSmall = useQuery(api.promoBanners.getActiveBanner, { type: "small" });
    const activePopup = useQuery(api.promoBanners.getActiveBanner, { type: "popup" });
    const activeInterstitial = useQuery(api.promoBanners.getActiveBanner, { type: "interstitial" });

    // Handle creating a banner if none exists, then navigate to edit
    const handleEditOrCreate = async (type: "main" | "small" | "popup" | "interstitial", existingId?: Id<"promo_banners">) => {
        if (existingId) {
            router.push(`/admin/banners/${existingId}`);
        } else {
            const newId = await seedBannerByType({ type });
            if (newId) {
                router.push(`/admin/banners/${newId}`);
            }
        }
    };

    const handleToggleActive = async (id: Id<"promo_banners">, isActive: boolean) => {
        await updateBanner({ id, isActive: !isActive });
    };

    const handleDelete = async (id: Id<"promo_banners">) => {
        if (confirm("Are you sure you want to delete this banner?")) {
            await deleteBanner({ id });
        }
    };

    const typeColors: Record<string, string> = {
        main: "bg-blue-500",
        small: "bg-green-500",
        popup: "bg-purple-500",
        interstitial: "bg-orange-500",
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">PROMO BANNERS</h1>
                    <p className="text-text-muted">Manage seasonal promotions & ads</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/banners/new"
                        className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                    >
                        <Plus size={20} />
                        New Banner
                    </Link>
                </div>
            </div>

            {/* Banner Types Legend */}
            <div className="flex flex-wrap gap-4">
                {Object.entries(typeColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="text-sm text-text-muted capitalize">{type}</span>
                    </div>
                ))}
            </div>

            {/* CURRENT ACTIVE BANNERS - What's showing on the site */}
            <div className="bg-stadium-elevated border-2 border-accent-green/50 rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Zap size={20} className="text-accent-green" />
                    Currently Active on Site
                </h2>
                <p className="text-text-muted text-sm mb-6">
                    These are the banners currently showing to users. Click Edit to modify.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Main Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-blue-400 font-bold text-sm flex items-center gap-1">
                                <Monitor size={14} /> MAIN
                            </span>
                            {activeMain ? (
                                <span className="px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs rounded font-bold">LIVE</span>
                            ) : (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-bold">DEFAULT</span>
                            )}
                        </div>
                        <p className="text-white font-semibold text-sm truncate mb-1">
                            {activeMain?.headline || "Ads suck but keep the site free."}
                        </p>
                        <p className="text-text-muted text-xs truncate mb-3">
                            {activeMain?.name || "Using hardcoded defaults"}
                        </p>
                        <button
                            onClick={() => handleEditOrCreate("main", activeMain?._id)}
                            className="w-full px-3 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit2 size={14} /> {activeMain ? "Edit Banner" : "Create & Edit"}
                        </button>
                    </div>

                    {/* Small Banner */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-green-400 font-bold text-sm flex items-center gap-1">
                                <Square size={14} /> SMALL
                            </span>
                            {activeSmall ? (
                                <span className="px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs rounded font-bold">LIVE</span>
                            ) : (
                                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded font-bold">NONE</span>
                            )}
                        </div>
                        <p className="text-white font-semibold text-sm truncate mb-1">
                            {activeSmall?.headline || "No small banner set"}
                        </p>
                        <p className="text-text-muted text-xs truncate mb-3">
                            {activeSmall?.name || "Click to create one"}
                        </p>
                        <button
                            onClick={() => handleEditOrCreate("small", activeSmall?._id)}
                            className="w-full px-3 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit2 size={14} /> {activeSmall ? "Edit Banner" : "Create & Edit"}
                        </button>
                    </div>

                    {/* Popup Banner */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-purple-400 font-bold text-sm flex items-center gap-1">
                                <MessageSquareMore size={14} /> POPUP
                            </span>
                            {activePopup ? (
                                <span className="px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs rounded font-bold">LIVE</span>
                            ) : (
                                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded font-bold">NONE</span>
                            )}
                        </div>
                        <p className="text-white font-semibold text-sm truncate mb-1">
                            {activePopup?.headline || "No popup banner set"}
                        </p>
                        <p className="text-text-muted text-xs truncate mb-3">
                            {activePopup?.name || "Click to create one"}
                        </p>
                        <button
                            onClick={() => handleEditOrCreate("popup", activePopup?._id)}
                            className="w-full px-3 py-2 bg-purple-500 text-white text-sm font-bold rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit2 size={14} /> {activePopup ? "Edit Banner" : "Create & Edit"}
                        </button>
                    </div>

                    {/* Interstitial Banner */}
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-orange-400 font-bold text-sm flex items-center gap-1">
                                <Maximize size={14} /> INTERSTITIAL
                            </span>
                            {activeInterstitial ? (
                                <span className="px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs rounded font-bold">LIVE</span>
                            ) : (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-bold">DEFAULT</span>
                            )}
                        </div>
                        <p className="text-white font-semibold text-sm truncate mb-1">
                            {activeInterstitial?.headline || "Premium"}
                        </p>
                        <p className="text-text-muted text-xs truncate mb-3">
                            {activeInterstitial?.name || "Using hardcoded defaults"}
                        </p>
                        <button
                            onClick={() => handleEditOrCreate("interstitial", activeInterstitial?._id)}
                            className="w-full px-3 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit2 size={14} /> {activeInterstitial ? "Edit Banner" : "Create & Edit"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Banner Samples with Previews */}
            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Sparkles size={20} className="text-accent-green" />
                    Banner Samples
                </h2>
                <p className="text-text-muted text-sm mb-6">
                    Preview each banner type and seed a sample to edit
                </p>

                <div className="grid gap-6">
                    {/* MAIN Banner Sample */}
                    <div className="border border-blue-500/30 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-blue-500/10">
                            <span className="font-bold text-sm text-blue-400 flex items-center gap-2">
                                <Monitor size={16} /> MAIN BANNER
                            </span>
                            <button
                                onClick={() => seedBannerByType({ type: "main" })}
                                className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                + Seed Sample
                            </button>
                        </div>
                        {/* Main Banner Preview */}
                        <div className="relative bg-[#1a3a5c] p-6 flex items-center justify-between overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a5c] via-[#1a3a5c]/90 to-[#1a3a5c]/70" />
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">🐉</span>
                                </div>
                                <div>
                                    <p className="font-bold text-white">Ads suck but keep the site <span className="text-[#9AE600]">free.</span></p>
                                    <p className="text-white/70 text-sm">Remove ads and get many features with Premium</p>
                                </div>
                            </div>
                            <button className="relative z-10 px-4 py-2 bg-[#9AE600] text-black font-bold rounded-lg text-sm">
                                CHECK OPTIONS
                            </button>
                        </div>
                    </div>

                    {/* SMALL Banner Sample */}
                    <div className="border border-green-500/30 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-green-500/10">
                            <span className="font-bold text-sm text-green-400 flex items-center gap-2">
                                <Square size={16} /> SMALL BANNER
                            </span>
                            <button
                                onClick={() => seedBannerByType({ type: "small" })}
                                className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors"
                            >
                                + Seed Sample
                            </button>
                        </div>
                        {/* Small Banner Preview */}
                        <div className="bg-[#2a1a4c] p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🐉</span>
                                <div>
                                    <p className="font-bold text-[#FFD700] text-sm">Go Premium!</p>
                                    <p className="text-white/60 text-xs">Unlock exclusive features</p>
                                </div>
                            </div>
                            <button className="px-3 py-1.5 bg-[#FFD700] text-black font-bold rounded text-xs">
                                UPGRADE
                            </button>
                        </div>
                    </div>

                    {/* POPUP Banner Sample */}
                    <div className="border border-purple-500/30 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-purple-500/10">
                            <span className="font-bold text-sm text-purple-400 flex items-center gap-2">
                                <MessageSquareMore size={16} /> POPUP BANNER
                            </span>
                            <button
                                onClick={() => seedBannerByType({ type: "popup" })}
                                className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                + Seed Sample
                            </button>
                        </div>
                        {/* Popup Banner Preview */}
                        <div className="bg-[#0d1117] p-6 relative">
                            <div className="max-w-sm mx-auto bg-stadium-elevated border border-border-strong rounded-xl p-6 text-center">
                                <div className="flex justify-center gap-2 mb-4">
                                    <span className="text-2xl">🐉</span>
                                    <span className="text-2xl">🎬</span>
                                </div>
                                <p className="font-bold text-[#FF6B6B] text-lg mb-1">Limited Time Offer!</p>
                                <p className="text-white/70 text-sm mb-4">Get 50% off Premium today</p>
                                <button className="px-4 py-2 bg-[#FF6B6B] text-white font-bold rounded-lg text-sm w-full">
                                    CLAIM OFFER
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* INTERSTITIAL Banner Sample */}
                    <div className="border border-orange-500/30 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-orange-500/10">
                            <span className="font-bold text-sm text-orange-400 flex items-center gap-2">
                                <Maximize size={16} /> INTERSTITIAL (Full-screen Ad)
                            </span>
                            <button
                                onClick={() => seedBannerByType({ type: "interstitial" })}
                                className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                + Seed Sample
                            </button>
                        </div>
                        {/* Interstitial Banner Preview - Mini version */}
                        <div className="bg-black p-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                                        <span className="text-3xl">⭐</span>
                                    </div>
                                    <div>
                                        <p className="text-[#9AE600] font-bold text-xl">Premium</p>
                                        <p className="text-white font-bold">Membership ?</p>
                                        <p className="text-white/50 text-xs mt-1">Support us and go ad-free</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex flex-col gap-1 text-xs mb-2">
                                        <span className="text-white/70">Watch <span className="text-[#9AE600] font-bold">Full HD</span></span>
                                        <span className="text-white/70">Download <span className="text-[#9AE600] font-bold">Directly</span></span>
                                        <span className="text-white/70">Watch <span className="text-[#9AE600] font-bold">Without Ads</span></span>
                                    </div>
                                    <button className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg text-sm">
                                        CHECK OUR PLANS
                                    </button>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                <div className="h-full w-1/3 bg-[#9AE600]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banners List */}
            <div className="grid gap-4">
                {!banners ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-green mx-auto"></div>
                    </div>
                ) : banners.length === 0 ? (
                    <div className="text-center py-12 bg-stadium-elevated border border-border-strong rounded-2xl">
                        <Sparkles size={48} className="mx-auto mb-4 text-text-muted/30" />
                        <p className="text-text-muted mb-4">No banners yet</p>
                        <button
                            onClick={() => seedBanner()}
                            className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold text-sm"
                        >
                            Create Default Banner
                        </button>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div
                            key={banner._id}
                            className={`bg-stadium-elevated border border-border-strong rounded-2xl p-6 ${!banner.isActive ? "opacity-60" : ""
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${typeColors[banner.type]}`}>
                                            {banner.type.toUpperCase()}
                                        </span>
                                        <h3 className="font-bold text-lg">{banner.name}</h3>
                                        {!banner.isActive && (
                                            <span className="px-2 py-0.5 bg-gray-600 rounded text-xs">Inactive</span>
                                        )}
                                    </div>

                                    <p className="text-accent-green font-semibold mb-1">{banner.headline}</p>
                                    {banner.subheadline && (
                                        <p className="text-text-muted text-sm mb-3">{banner.subheadline}</p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                                        <span>CTA: <span className="text-white">{banner.ctaText}</span></span>
                                        <span>Link: <span className="text-white">{banner.ctaLink}</span></span>
                                        <span>Priority: <span className="text-white">{banner.priority}</span></span>
                                        {banner.startDate && (
                                            <span>Start: <span className="text-white">{new Date(banner.startDate).toLocaleDateString()}</span></span>
                                        )}
                                        {banner.endDate && (
                                            <span>End: <span className="text-white">{new Date(banner.endDate).toLocaleDateString()}</span></span>
                                        )}
                                    </div>

                                    {/* Image previews */}
                                    <div className="flex gap-4 mt-4">
                                        {banner.leftImageUrl && (
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-border-subtle">
                                                <img src={banner.leftImageUrl} alt="Left" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        {banner.rightImageUrl && (
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-border-subtle">
                                                <img src={banner.rightImageUrl} alt="Right" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        {banner.backgroundImageUrl && (
                                            <div className="flex items-center gap-2 text-xs text-text-muted">
                                                <ImageIcon size={14} />
                                                <span>Has background</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleActive(banner._id, banner.isActive)}
                                        className={`p-2 rounded-lg transition-colors ${banner.isActive
                                            ? "bg-accent-green/20 text-accent-green hover:bg-accent-green/30"
                                            : "bg-gray-600/20 text-gray-400 hover:bg-gray-600/30"
                                            }`}
                                        title={banner.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {banner.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <Link
                                        href={`/admin/banners/${banner._id}`}
                                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(banner._id)}
                                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
