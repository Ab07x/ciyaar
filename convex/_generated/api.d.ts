/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ads from "../ads.js";
import type * as allowedLeagues from "../allowedLeagues.js";
import type * as analytics from "../analytics.js";
import type * as categories from "../categories.js";
import type * as channels from "../channels.js";
import type * as crons from "../crons.js";
import type * as enableAds from "../enableAds.js";
import type * as fixtures from "../fixtures.js";
import type * as gifts from "../gifts.js";
import type * as heroSlides from "../heroSlides.js";
import type * as imageFetcher from "../imageFetcher.js";
import type * as leagues from "../leagues.js";
import type * as matches from "../matches.js";
import type * as media from "../media.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as movies from "../movies.js";
import type * as mylist from "../mylist.js";
import type * as notifications from "../notifications.js";
import type * as omdb from "../omdb.js";
import type * as posterFix from "../posterFix.js";
import type * as posts from "../posts.js";
import type * as ppv from "../ppv.js";
import type * as predictions from "../predictions.js";
import type * as promoBanners from "../promoBanners.js";
import type * as push from "../push.js";
import type * as pushActions from "../pushActions.js";
import type * as ratings from "../ratings.js";
import type * as recommendations from "../recommendations.js";
import type * as redemptions from "../redemptions.js";
import type * as referrals from "../referrals.js";
import type * as reminders from "../reminders.js";
import type * as requests from "../requests.js";
import type * as search from "../search.js";
import type * as searchAnalytics from "../searchAnalytics.js";
import type * as seedChannels from "../seedChannels.js";
import type * as series from "../series.js";
import type * as settings from "../settings.js";
import type * as shorts from "../shorts.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tmdb from "../tmdb.js";
import type * as users from "../users.js";
import type * as watch from "../watch.js";
import type * as whatsapp from "../whatsapp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ads: typeof ads;
  allowedLeagues: typeof allowedLeagues;
  analytics: typeof analytics;
  categories: typeof categories;
  channels: typeof channels;
  crons: typeof crons;
  enableAds: typeof enableAds;
  fixtures: typeof fixtures;
  gifts: typeof gifts;
  heroSlides: typeof heroSlides;
  imageFetcher: typeof imageFetcher;
  leagues: typeof leagues;
  matches: typeof matches;
  media: typeof media;
  messages: typeof messages;
  migrations: typeof migrations;
  movies: typeof movies;
  mylist: typeof mylist;
  notifications: typeof notifications;
  omdb: typeof omdb;
  posterFix: typeof posterFix;
  posts: typeof posts;
  ppv: typeof ppv;
  predictions: typeof predictions;
  promoBanners: typeof promoBanners;
  push: typeof push;
  pushActions: typeof pushActions;
  ratings: typeof ratings;
  recommendations: typeof recommendations;
  redemptions: typeof redemptions;
  referrals: typeof referrals;
  reminders: typeof reminders;
  requests: typeof requests;
  search: typeof search;
  searchAnalytics: typeof searchAnalytics;
  seedChannels: typeof seedChannels;
  series: typeof series;
  settings: typeof settings;
  shorts: typeof shorts;
  subscriptions: typeof subscriptions;
  tmdb: typeof tmdb;
  users: typeof users;
  watch: typeof watch;
  whatsapp: typeof whatsapp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
