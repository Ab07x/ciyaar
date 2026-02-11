import mongoose, { Schema, Document } from "mongoose";

// SETTINGS
export interface ISettings extends Document {
    convexId?: string;
    whatsappNumber: string;
    siteName: string;
    adsEnabled: boolean;
    cookieDays?: number;
    premiumPriceText?: string;
    priceMatch: number;
    priceDaily?: number;
    priceWeekly: number;
    priceMonthly: number;
    priceYearly: number;
    priceStarter?: number;
    pricePlus?: number;
    pricePro?: number;
    priceElite?: number;
    maxDevicesMatch: number;
    maxDevicesWeekly: number;
    maxDevicesMonthly: number;
    maxDevicesYearly: number;
    adminPassword?: string;
    logoUrl?: string;
    faviconUrl?: string;
    seoTagline?: string;
    seoDescription?: string;
    seoKeywords?: string;
    ogImage?: string;
    twitterHandle?: string;
    googleAnalyticsId?: string;
    googleVerification?: string;
    sitemapEnabled?: boolean;
    footballApiKey?: string;
    freeMovieOfWeek?: string;
    freeMatchPreviewMinutes?: number;
    trialDays?: number;
}

const SettingsSchema = new Schema<ISettings>(
    {
        convexId: String,
        whatsappNumber: { type: String, required: true },
        siteName: { type: String, required: true },
        adsEnabled: { type: Boolean, required: true },
        cookieDays: Number,
        premiumPriceText: String,
        priceMatch: { type: Number, required: true },
        priceDaily: Number,
        priceWeekly: { type: Number, required: true },
        priceMonthly: { type: Number, required: true },
        priceYearly: { type: Number, required: true },
        priceStarter: Number,
        pricePlus: Number,
        pricePro: Number,
        priceElite: Number,
        maxDevicesMatch: { type: Number, required: true },
        maxDevicesWeekly: { type: Number, required: true },
        maxDevicesMonthly: { type: Number, required: true },
        maxDevicesYearly: { type: Number, required: true },
        adminPassword: String,
        logoUrl: String,
        faviconUrl: String,
        seoTagline: String,
        seoDescription: String,
        seoKeywords: String,
        ogImage: String,
        twitterHandle: String,
        googleAnalyticsId: String,
        googleVerification: String,
        sitemapEnabled: Boolean,
        footballApiKey: String,
        freeMovieOfWeek: String,
        freeMatchPreviewMinutes: Number,
        trialDays: Number,
    },
    { timestamps: false }
);

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema, "settings");

// ADS
export interface IAd extends Document {
    convexId?: string;
    slotKey: string;
    network: string;
    format: string;
    codeHtml?: string;
    adsenseClient?: string;
    adsenseSlot?: string;
    adsterraKey?: string;
    adsterraDomain?: string;
    vastUrl?: string;
    vpaidEnabled?: boolean;
    videoUrl?: string;
    videoSkipAfter?: number;
    videoDuration?: number;
    popupUrl?: string;
    popupWidth?: number;
    popupHeight?: number;
    monetagId?: string;
    showOn: string[];
    enabled: boolean;
}

const AdSchema = new Schema<IAd>(
    {
        convexId: String,
        slotKey: { type: String, required: true, index: true },
        network: { type: String, required: true },
        format: { type: String, required: true },
        codeHtml: String,
        adsenseClient: String,
        adsenseSlot: String,
        adsterraKey: String,
        adsterraDomain: String,
        vastUrl: String,
        vpaidEnabled: Boolean,
        videoUrl: String,
        videoSkipAfter: Number,
        videoDuration: Number,
        popupUrl: String,
        popupWidth: Number,
        popupHeight: Number,
        monetagId: String,
        showOn: [String],
        enabled: { type: Boolean, required: true },
    },
    { timestamps: false }
);

export const Ad = mongoose.models.Ad || mongoose.model<IAd>("Ad", AdSchema, "ads");

// POSTS
export interface IPost extends Document {
    convexId?: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    featuredImageUrl?: string;
    category: string;
    tags: string[];
    publishedAt?: number;
    isPublished: boolean;
    seoTitle?: string;
    seoDescription?: string;
    views?: number;
    createdAt: number;
    updatedAt: number;
}

const PostSchema = new Schema<IPost>(
    {
        convexId: String,
        slug: { type: String, required: true, index: true },
        title: { type: String, required: true },
        excerpt: { type: String, required: true },
        content: { type: String, required: true },
        featuredImageUrl: String,
        category: { type: String, required: true, index: true },
        tags: [String],
        publishedAt: Number,
        isPublished: { type: Boolean, default: true, index: true },
        seoTitle: String,
        seoDescription: String,
        views: { type: Number, default: 0 },
        createdAt: { type: Number, required: true },
        updatedAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Post = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema, "posts");

// CHANNELS
export interface IChannel extends Document {
    convexId?: string;
    slug: string;
    name: string;
    description?: string;
    thumbnailUrl?: string;
    category: string;
    embeds: { label: string; url: string; type?: string; isProtected?: boolean }[];
    isPremium: boolean;
    isLive: boolean;
    priority: number;
    createdAt: number;
    updatedAt: number;
}

const ChannelSchema = new Schema<IChannel>(
    {
        convexId: String,
        slug: { type: String, required: true, index: true },
        name: { type: String, required: true },
        description: String,
        thumbnailUrl: String,
        category: { type: String, required: true, index: true },
        embeds: [{ label: String, url: String, type: String, isProtected: Boolean }],
        isPremium: { type: Boolean, required: true },
        isLive: { type: Boolean, required: true },
        priority: { type: Number, required: true },
        createdAt: { type: Number, required: true },
        updatedAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Channel = mongoose.models.Channel || mongoose.model<IChannel>("Channel", ChannelSchema, "channels");

// CATEGORIES
export interface ICategory extends Document {
    convexId?: string;
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    color?: string;
    order: number;
    isActive: boolean;
    createdAt: number;
}

const CategorySchema = new Schema<ICategory>(
    {
        convexId: String,
        name: { type: String, required: true },
        slug: { type: String, required: true, index: true },
        description: String,
        iconUrl: String,
        color: String,
        order: { type: Number, required: true },
        isActive: { type: Boolean, required: true },
        createdAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema, "categories");

// LEAGUES
export interface ILeague extends Document {
    convexId?: string;
    name: string;
    type: string;
    country?: string;
    logoUrl?: string;
    apiId?: string;
    createdAt: number;
}

const LeagueSchema = new Schema<ILeague>(
    {
        convexId: String,
        name: { type: String, required: true, index: true },
        type: { type: String, required: true },
        country: String,
        logoUrl: String,
        apiId: String,
        createdAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const League = mongoose.models.League || mongoose.model<ILeague>("League", LeagueSchema, "leagues");

// FIXTURES
export interface IFixture extends Document {
    convexId?: string;
    apiFixtureId: number;
    slug: string;
    kickoffAt: number;
    kickoffISO: string;
    timezone: string;
    statusNormalized: string;
    rawStatusShort: string;
    rawStatusLong: string;
    homeName: string;
    homeLogo: string;
    awayName: string;
    awayLogo: string;
    leagueName: string;
    leagueLogo: string;
    description: string;
    fetchedForDate: string;
    createdAt: number;
    updatedAt: number;
}

const FixtureSchema = new Schema<IFixture>(
    {
        convexId: String,
        apiFixtureId: { type: Number, required: true, index: true },
        slug: { type: String, required: true, index: true },
        kickoffAt: { type: Number, required: true, index: true },
        kickoffISO: String,
        timezone: String,
        statusNormalized: { type: String, index: true },
        rawStatusShort: String,
        rawStatusLong: String,
        homeName: String,
        homeLogo: String,
        awayName: String,
        awayLogo: String,
        leagueName: String,
        leagueLogo: String,
        description: String,
        fetchedForDate: { type: String, index: true },
        createdAt: { type: Number, required: true },
        updatedAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Fixture = mongoose.models.Fixture || mongoose.model<IFixture>("Fixture", FixtureSchema, "fixtures");

// PAYMENTS
export interface IPayment extends Document {
    convexId?: string;
    deviceId: string;
    userId?: string;
    plan: string;
    amount: number;
    currency: string;
    orderId: string;
    gateway: string;
    sifaloKey?: string;
    sifaloToken?: string;
    sifaloSid?: string;
    status: string;
    paymentType?: string;
    subscriptionId?: string;
    createdAt: number;
    verifiedAt?: number;
}

const PaymentSchema = new Schema<IPayment>(
    {
        convexId: String,
        deviceId: { type: String, index: true },
        userId: String,
        plan: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        orderId: { type: String, required: true, index: true },
        gateway: String,
        sifaloKey: String,
        sifaloToken: String,
        sifaloSid: String,
        status: { type: String, required: true, index: true },
        paymentType: String,
        subscriptionId: String,
        createdAt: { type: Number, required: true },
        verifiedAt: Number,
    },
    { timestamps: false }
);

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema, "payments");
