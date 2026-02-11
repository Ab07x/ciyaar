import mongoose, { Schema, Document } from "mongoose";

// PUSH SUBSCRIPTIONS
export interface IPushSubscription extends Document {
    convexId?: string;
    userId?: string;
    deviceId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    fcmToken?: string;
    userAgent?: string;
    isActive: boolean;
    createdAt: number;
    lastUsedAt: number;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
    {
        convexId: String,
        userId: String,
        deviceId: { type: String, index: true },
        endpoint: { type: String, required: true, index: true },
        keys: { p256dh: String, auth: String },
        fcmToken: String,
        userAgent: String,
        isActive: { type: Boolean, required: true },
        createdAt: { type: Number, required: true },
        lastUsedAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const PushSubscription = mongoose.models.PushSubscription || mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema, "push_subscriptions");

// PROMO BANNERS
export interface IPromoBanner extends Document {
    convexId?: string;
    name: string;
    type: string;
    headline: string;
    subheadline?: string;
    ctaText: string;
    ctaLink: string;
    leftImageUrl?: string;
    rightImageUrl?: string;
    backgroundImageUrl?: string;
    backgroundColor?: string;
    accentColor?: string;
    startDate?: number;
    endDate?: number;
    isActive: boolean;
    priority: number;
    createdAt: number;
    updatedAt: number;
}

const PromoBannerSchema = new Schema<IPromoBanner>(
    {
        convexId: String,
        name: String,
        type: String,
        headline: String,
        subheadline: String,
        ctaText: String,
        ctaLink: String,
        leftImageUrl: String,
        rightImageUrl: String,
        backgroundImageUrl: String,
        backgroundColor: String,
        accentColor: String,
        startDate: Number,
        endDate: Number,
        isActive: { type: Boolean, index: true },
        priority: { type: Number, index: true },
        createdAt: Number,
        updatedAt: Number,
    },
    { timestamps: false }
);

export const PromoBanner = mongoose.models.PromoBanner || mongoose.model<IPromoBanner>("PromoBanner", PromoBannerSchema, "promo_banners");

// SHORTS
export interface IShort extends Document {
    convexId?: string;
    title: string;
    embedUrl: string;
    thumbnailUrl: string;
    views: number;
    isLive: boolean;
    channelName?: string;
    createdAt: number;
    isPublished: boolean;
}

const ShortSchema = new Schema<IShort>(
    {
        convexId: String,
        title: String,
        embedUrl: String,
        thumbnailUrl: String,
        views: { type: Number, default: 0 },
        isLive: Boolean,
        channelName: String,
        createdAt: Number,
        isPublished: { type: Boolean, index: true },
    },
    { timestamps: false }
);

export const Short = mongoose.models.Short || mongoose.model<IShort>("Short", ShortSchema, "shorts");

// HERO SLIDES
export interface IHeroSlide extends Document {
    convexId?: string;
    contentType: string;
    contentId?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    order: number;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
    {
        convexId: String,
        contentType: String,
        contentId: String,
        title: String,
        subtitle: String,
        description: String,
        imageUrl: String,
        ctaText: String,
        ctaLink: String,
        order: Number,
        isActive: { type: Boolean, index: true },
        createdAt: Number,
        updatedAt: Number,
    },
    { timestamps: false }
);

export const HeroSlide = mongoose.models.HeroSlide || mongoose.model<IHeroSlide>("HeroSlide", HeroSlideSchema, "hero_slides");

// MESSAGES (Live Chat)
export interface IMessage extends Document {
    convexId?: string;
    matchId: string;
    userId: string;
    nickname: string;
    content: string;
    isPremium: boolean;
    createdAt: number;
}

const MessageSchema = new Schema<IMessage>(
    {
        convexId: String,
        matchId: { type: String, required: true, index: true },
        userId: { type: String, required: true },
        nickname: String,
        content: String,
        isPremium: Boolean,
        createdAt: { type: Number, required: true },
    },
    { timestamps: false }
);

MessageSchema.index({ matchId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema, "messages");

// PAGE VIEWS
export interface IPageView extends Document {
    convexId?: string;
    date: string;
    pageType: string;
    pageId?: string;
    views: number;
    uniqueViews?: number;
}

const PageViewSchema = new Schema<IPageView>(
    {
        convexId: String,
        date: { type: String, index: true },
        pageType: { type: String, index: true },
        pageId: String,
        views: { type: Number, default: 0 },
        uniqueViews: Number,
    },
    { timestamps: false }
);

PageViewSchema.index({ date: 1, pageType: 1 });

export const PageView = mongoose.models.PageView || mongoose.model<IPageView>("PageView", PageViewSchema, "page_views");

// SEARCH ANALYTICS
export interface ISearchAnalytics extends Document {
    convexId?: string;
    query: string;
    queryLower: string;
    resultsCount: number;
    hasResults: boolean;
    clickedItem?: string;
    clickedItemType?: string;
    deviceId?: string;
    userId?: string;
    userAgent?: string;
    sessionId?: string;
    createdAt: number;
}

const SearchAnalyticsSchema = new Schema<ISearchAnalytics>(
    {
        convexId: String,
        query: String,
        queryLower: { type: String, index: true },
        resultsCount: Number,
        hasResults: Boolean,
        clickedItem: String,
        clickedItemType: String,
        deviceId: String,
        userId: String,
        userAgent: String,
        sessionId: String,
        createdAt: { type: Number, index: true },
    },
    { timestamps: false }
);

export const SearchAnalytics = mongoose.models.SearchAnalytics || mongoose.model<ISearchAnalytics>("SearchAnalytics", SearchAnalyticsSchema, "search_analytics");

// CONTENT REQUESTS
export interface IContentRequest extends Document {
    convexId?: string;
    userId: string;
    tmdbId: number;
    type: string;
    title: string;
    posterUrl?: string;
    year?: string;
    votes: number;
    status: string;
    createdAt: number;
}

const ContentRequestSchema = new Schema<IContentRequest>(
    {
        convexId: String,
        userId: String,
        tmdbId: Number,
        type: String,
        title: String,
        posterUrl: String,
        year: String,
        votes: { type: Number, default: 0 },
        status: { type: String, index: true },
        createdAt: Number,
    },
    { timestamps: false }
);

export const ContentRequest = mongoose.models.ContentRequest || mongoose.model<IContentRequest>("ContentRequest", ContentRequestSchema, "content_requests");

// MISC COLLECTIONS (smaller ones grouped together)

// Predictions
const PredictionSchema = new Schema({
    convexId: String,
    userId: { type: String, index: true },
    matchId: { type: String, index: true },
    prediction: String,
    status: String,
    pointsAwarded: Number,
    createdAt: Number,
}, { timestamps: false, strict: false });
export const Prediction = mongoose.models.Prediction || mongoose.model("Prediction", PredictionSchema, "predictions");

// Leaderboards
const LeaderboardSchema = new Schema({
    convexId: String,
    userId: { type: String, index: true },
    totalPoints: Number,
    weeklyPoints: Number,
    monthlyPoints: Number,
    streakCount: Number,
    bestStreak: Number,
    predictionsCount: Number,
    correctPredictionsCount: Number,
    lastPredictionAt: Number,
    updatedAt: Number,
}, { timestamps: false, strict: false });
export const Leaderboard = mongoose.models.Leaderboard || mongoose.model("Leaderboard", LeaderboardSchema, "leaderboards");

// Ad Impressions
const AdImpressionSchema = new Schema({
    convexId: String,
    userId: String,
    deviceId: { type: String, index: true },
    adType: String,
    adSlot: String,
    pageType: String,
    contentId: String,
    timestamp: { type: Number, index: true },
}, { timestamps: false, strict: false });
export const AdImpression = mongoose.models.AdImpression || mongoose.model("AdImpression", AdImpressionSchema, "ad_impressions");

// PPV
const PPVContentSchema = new Schema({}, { timestamps: false, strict: false });
export const PPVContent = mongoose.models.PPVContent || mongoose.model("PPVContent", PPVContentSchema, "ppv_content");

const PPVPurchaseSchema = new Schema({}, { timestamps: false, strict: false });
export const PPVPurchase = mongoose.models.PPVPurchase || mongoose.model("PPVPurchase", PPVPurchaseSchema, "ppv_purchases");

// Sync Logs
const SyncLogSchema = new Schema({}, { timestamps: false, strict: false });
export const SyncLog = mongoose.models.SyncLog || mongoose.model("SyncLog", SyncLogSchema, "sync_logs");

// Allowed Leagues
const AllowedLeagueSchema = new Schema({}, { timestamps: false, strict: false });
export const AllowedLeague = mongoose.models.AllowedLeague || mongoose.model("AllowedLeague", AllowedLeagueSchema, "allowed_leagues");

// Media
const MediaSchema = new Schema({}, { timestamps: false, strict: false });
export const Media = mongoose.models.Media || mongoose.model("Media", MediaSchema, "media");

// Referral Clicks
const ReferralClickSchema = new Schema({}, { timestamps: false, strict: false });
export const ReferralClick = mongoose.models.ReferralClick || mongoose.model("ReferralClick", ReferralClickSchema, "referral_clicks");

// Gift Codes
const GiftCodeSchema = new Schema({}, { timestamps: false, strict: false });
export const GiftCode = mongoose.models.GiftCode || mongoose.model("GiftCode", GiftCodeSchema, "gift_codes");

// Rating
const RatingSchema = new Schema({}, { timestamps: false, strict: false });
export const Rating = mongoose.models.Rating || mongoose.model("Rating", RatingSchema, "ratings");

// Rating Votes  
const RatingVoteSchema = new Schema({}, { timestamps: false, strict: false });
export const RatingVote = mongoose.models.RatingVote || mongoose.model("RatingVote", RatingVoteSchema, "rating_votes");

// Notification Logs
const NotificationLogSchema = new Schema({}, { timestamps: false, strict: false });
export const NotificationLog = mongoose.models.NotificationLog || mongoose.model("NotificationLog", NotificationLogSchema, "notification_logs");

// Notification Preferences
const NotificationPreferenceSchema = new Schema({}, { timestamps: false, strict: false });
export const NotificationPreference = mongoose.models.NotificationPreference || mongoose.model("NotificationPreference", NotificationPreferenceSchema, "notification_preferences");

// Match Reminders
const MatchReminderSchema = new Schema({}, { timestamps: false, strict: false });
export const MatchReminder = mongoose.models.MatchReminder || mongoose.model("MatchReminder", MatchReminderSchema, "match_reminders");

// Content Request Votes
const ContentRequestVoteSchema = new Schema({}, { timestamps: false, strict: false });
export const ContentRequestVote = mongoose.models.ContentRequestVote || mongoose.model("ContentRequestVote", ContentRequestVoteSchema, "content_request_votes");

// My List
const UserMyListSchema = new Schema({
    convexId: String,
    userId: { type: String, index: true },
    contentType: String,
    contentId: String,
    addedAt: Number,
}, { timestamps: false, strict: false });
UserMyListSchema.index({ userId: 1, contentType: 1, contentId: 1 });
export const UserMyList = mongoose.models.UserMyList || mongoose.model("UserMyList", UserMyListSchema, "user_mylist");

// Watch Progress
const UserWatchProgressSchema = new Schema({
    convexId: String,
    userId: { type: String, index: true },
    contentType: String,
    contentId: String,
    seriesId: String,
    progressSeconds: Number,
    durationSeconds: Number,
    isFinished: Boolean,
    updatedAt: Number,
}, { timestamps: false, strict: false });
export const UserWatchProgress = mongoose.models.UserWatchProgress || mongoose.model("UserWatchProgress", UserWatchProgressSchema, "user_watch_progress");
