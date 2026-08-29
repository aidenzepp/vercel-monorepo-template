import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  lastLoginMethod,
  oAuthProxy,
  testUtils,
} from "better-auth/plugins";

import { db } from "@/db/client";
import * as schema from "@/db/schema/auth";
import { env } from "@/env";

const VERCEL_ALLOWED_HOSTS = [
  env.VERCEL_URL,
  env.VERCEL_BRANCH_URL,
  env.VERCEL_PROJECT_PRODUCTION_URL,
].filter((host): host is string => host !== undefined);

const auth = betterAuth({
  account: { encryptOAuthTokens: true },
  advanced: {
    database: { joins: true },
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
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
    testUtils(),
    dash({
      activityTracking: { enabled: true },
      apiKey: env.BETTER_AUTH_API_KEY,
    }),
    nextCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET,
});

export { auth };
