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
import type * as channels from "../channels.js";
import type * as enableAds from "../enableAds.js";
import type * as fixtures from "../fixtures.js";
import type * as leagues from "../leagues.js";
import type * as matches from "../matches.js";
import type * as messages from "../messages.js";
import type * as movies from "../movies.js";
import type * as mylist from "../mylist.js";
import type * as posts from "../posts.js";
import type * as redemptions from "../redemptions.js";
import type * as search from "../search.js";
import type * as series from "../series.js";
import type * as settings from "../settings.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tmdb from "../tmdb.js";
import type * as users from "../users.js";
import type * as watch from "../watch.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ads: typeof ads;
  allowedLeagues: typeof allowedLeagues;
  analytics: typeof analytics;
  channels: typeof channels;
  enableAds: typeof enableAds;
  fixtures: typeof fixtures;
  leagues: typeof leagues;
  matches: typeof matches;
  messages: typeof messages;
  movies: typeof movies;
  mylist: typeof mylist;
  posts: typeof posts;
  redemptions: typeof redemptions;
  search: typeof search;
  series: typeof series;
  settings: typeof settings;
  subscriptions: typeof subscriptions;
  tmdb: typeof tmdb;
  users: typeof users;
  watch: typeof watch;
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
