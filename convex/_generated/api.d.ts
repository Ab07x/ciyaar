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
import type * as analytics from "../analytics.js";
import type * as enableAds from "../enableAds.js";
import type * as fixtures from "../fixtures.js";
import type * as leagues from "../leagues.js";
import type * as matches from "../matches.js";
import type * as messages from "../messages.js";
import type * as posts from "../posts.js";
import type * as redemptions from "../redemptions.js";
import type * as settings from "../settings.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ads: typeof ads;
  analytics: typeof analytics;
  enableAds: typeof enableAds;
  fixtures: typeof fixtures;
  leagues: typeof leagues;
  matches: typeof matches;
  messages: typeof messages;
  posts: typeof posts;
  redemptions: typeof redemptions;
  settings: typeof settings;
  subscriptions: typeof subscriptions;
  users: typeof users;
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
