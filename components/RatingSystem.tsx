"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import {
    Star,
    ThumbsUp,
    Flag,
    Send,
    ChevronDown,
    ChevronUp,
    BadgeCheck,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface RatingSystemProps {
    contentType: "movie" | "series";
    contentId: string;
    contentTitle: string;
    className?: string;
}

export function RatingSystem({
    contentType,
    contentId,
    contentTitle,
    className,
}: RatingSystemProps) {
    const { user, isLoading: userLoading } = useUser();
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(0);
    const [review, setReview] = useState("");
    const [showReviewInput, setShowReviewInput] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Queries
    const averageRating = useQuery(api.ratings.getContentAverageRating, {
        contentType,
        contentId,
    });

    const userRating = useQuery(
        api.ratings.getUserRating,
        user?._id ? { userId: user._id, contentType, contentId } : "skip"
    );

    const reviews = useQuery(api.ratings.getContentRatings, {
        contentType,
        contentId,
        limit: showAllReviews ? 50 : 5,
    });

    // Mutations
    const upsertRating = useMutation(api.ratings.upsertRating);
    const markHelpful = useMutation(api.ratings.markHelpful);
    const reportRating = useMutation(api.ratings.reportRating);

    // Handle rating submission
    const handleSubmitRating = async () => {
        if (!user?._id || selectedRating === 0) return;

        setSubmitting(true);
        await upsertRating({
            userId: user._id,
            contentType,
            contentId,
            rating: selectedRating,
            review: review.trim() || undefined,
        });
        setSubmitting(false);
        setShowReviewInput(false);
        setReview("");
    };

    // Initialize selected rating from user's existing rating
    if (userRating && selectedRating === 0) {
        setSelectedRating(userRating.rating);
        if (userRating.review) {
            setReview(userRating.review);
        }
    }

    const displayRating = hoverRating || selectedRating;

    return (
        <div className={cn("space-y-6", className)}>
            {/* Average Rating Display */}
            <div className="bg-stadium-elevated rounded-2xl p-6 border border-border-subtle">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Big average number */}
                    <div className="text-center md:text-left">
                        <div className="text-5xl font-black text-accent-green">
                            {averageRating?.average.toFixed(1) || "—"}
                        </div>
                        <div className="text-sm text-text-muted mt-1">
                            {averageRating?.count || 0} qiimeyn
                        </div>
                    </div>

                    {/* Star distribution */}
                    <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = averageRating?.distribution[star - 1] || 0;
                            const percentage =
                                averageRating?.count
                                    ? (count / averageRating.count) * 100
                                    : 0;
                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-xs text-text-muted w-3">
                                        {star}
                                    </span>
                                    <Star className="w-3 h-3 text-accent-gold fill-accent-gold" />
                                    <div className="flex-1 h-2 bg-stadium-dark rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent-gold transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-text-muted w-8">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* User Rating Input */}
            <div className="bg-stadium-elevated rounded-2xl p-6 border border-border-subtle">
                <h3 className="font-bold mb-4">
                    {userRating ? "Qiimeyntaada" : "Qiimee " + contentTitle}
                </h3>

                {user ? (
                    <div className="space-y-4">
                        {/* Star selector */}
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => {
                                        setSelectedRating(star);
                                        setShowReviewInput(true);
                                    }}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "w-8 h-8 transition-colors",
                                            star <= displayRating
                                                ? "text-accent-gold fill-accent-gold"
                                                : "text-text-muted"
                                        )}
                                    />
                                </button>
                            ))}
                            {displayRating > 0 && (
                                <span className="ml-3 text-lg font-bold text-accent-gold">
                                    {displayRating}/5
                                </span>
                            )}
                        </div>

                        {/* Review input */}
                        {showReviewInput && (
                            <div className="space-y-3">
                                <textarea
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    placeholder="Faallada aad u qorto (optional)..."
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg p-4 text-white placeholder-text-muted resize-none focus:outline-none focus:border-accent-green"
                                    rows={3}
                                    maxLength={500}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted">
                                        {review.length}/500
                                    </span>
                                    <button
                                        onClick={handleSubmitRating}
                                        disabled={submitting || selectedRating === 0}
                                        className="px-6 py-2 bg-accent-green text-black font-bold rounded-lg hover:bg-accent-green/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        {userRating ? "Cusbooneysii" : "Dir"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {userRating && !showReviewInput && (
                            <button
                                onClick={() => setShowReviewInput(true)}
                                className="text-sm text-accent-green hover:underline"
                            >
                                Wax ka bedel qiimeyntaada
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-text-muted mb-3">
                            Soo gal si aad u qiimeysid
                        </p>
                        <a
                            href="/login"
                            className="inline-block px-6 py-2 bg-accent-green text-black font-bold rounded-lg hover:bg-accent-green/90 transition-colors"
                        >
                            Soo Gal
                        </a>
                    </div>
                )}
            </div>

            {/* Reviews List */}
            {reviews && reviews.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-lg">Faallooyin</h3>

                    {reviews.map((r) => (
                        <ReviewCard
                            key={r._id}
                            review={r}
                            onHelpful={() => markHelpful({ ratingId: r._id })}
                            onReport={() => reportRating({ ratingId: r._id })}
                        />
                    ))}

                    {averageRating && averageRating.count > 5 && (
                        <button
                            onClick={() => setShowAllReviews(!showAllReviews)}
                            className="flex items-center gap-2 text-accent-green hover:underline font-medium"
                        >
                            {showAllReviews ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Ka yar eeg
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Dhamaan eeg ({averageRating.count} faallo)
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Individual Review Card
function ReviewCard({
    review,
    onHelpful,
    onReport,
}: {
    review: any;
    onHelpful: () => void;
    onReport: () => void;
}) {
    const [helpful, setHelpful] = useState(false);
    const [reported, setReported] = useState(false);

    const handleHelpful = () => {
        if (helpful) return;
        setHelpful(true);
        onHelpful();
    };

    const handleReport = () => {
        if (reported) return;
        setReported(true);
        onReport();
    };

    return (
        <div className="bg-stadium-elevated rounded-xl p-4 border border-border-subtle">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-stadium-dark rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-text-muted">
                        {review.userName?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">
                            {review.userName}
                        </span>
                        {review.isVerifiedWatch && (
                            <span className="flex items-center gap-1 text-xs text-accent-green">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                            </span>
                        )}
                        <span className="text-xs text-text-muted">
                            {formatDistanceToNow(review.createdAt, {
                                addSuffix: true,
                            })}
                        </span>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 my-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn(
                                    "w-4 h-4",
                                    star <= review.rating
                                        ? "text-accent-gold fill-accent-gold"
                                        : "text-text-muted"
                                )}
                            />
                        ))}
                    </div>

                    {/* Review text */}
                    {review.review && (
                        <p className="text-text-secondary text-sm mt-2">
                            {review.review}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={handleHelpful}
                            disabled={helpful}
                            className={cn(
                                "flex items-center gap-1.5 text-xs transition-colors",
                                helpful
                                    ? "text-accent-green"
                                    : "text-text-muted hover:text-white"
                            )}
                        >
                            <ThumbsUp
                                className={cn("w-3.5 h-3.5", helpful && "fill-current")}
                            />
                            Waa caawiyay ({review.helpfulCount + (helpful ? 1 : 0)})
                        </button>
                        <button
                            onClick={handleReport}
                            disabled={reported}
                            className={cn(
                                "flex items-center gap-1.5 text-xs transition-colors",
                                reported
                                    ? "text-accent-red"
                                    : "text-text-muted hover:text-accent-red"
                            )}
                        >
                            <Flag className="w-3.5 h-3.5" />
                            {reported ? "Reported" : "Warbixin"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
