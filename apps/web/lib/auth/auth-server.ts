import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { dash } from "@better-auth/infra";
import { waitUntil } from "@vercel/functions";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";

import { db } from "@/db/client";
import * as schema from "@/db/schema/auth";
import { env } from "@/env";
import { createAuthPlugins } from "@/lib/auth/auth-plugins";

const VERCEL_ALLOWED_HOSTS = [
  env.VERCEL_URL,
  env.VERCEL_BRANCH_URL,
  env.VERCEL_PROJECT_PRODUCTION_URL,
].filter((host): host is string => host !== undefined);

const auth = betterAuth({
  account: { encryptOAuthTokens: true },
  advanced: {
    backgroundTasks: { handler: (promise) => waitUntil(promise) },
    database: { joins: true },
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
    trustedProxyHeaders: true,
  },
  baseURL: {
    allowedHosts: ["localhost:*", "127.0.0.1:*", ...VERCEL_ALLOWED_HOSTS],
    fallback: env.BETTER_AUTH_URL,
    protocol: "auto",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    schemaName: "auth",
    usePlural: false,
  }),
  plugins: [
    oAuthProxy({
      productionURL: env.BETTER_AUTH_URL,
      secret: env.OAUTH_PROXY_SECRET,
    }),
    admin(),
    lastLoginMethod(),
    ...createAuthPlugins(),
    dash({
      activityTracking: { enabled: true },
      apiKey: env.BETTER_AUTH_API_KEY,
    }),
    nextCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "compact",
    },
  },
});

export { auth };
