import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { dash } from "@better-auth/infra";
import { waitUntil } from "@vercel/functions";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod, testUtils } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";

import { db } from "@/db/client";
import * as schema from "@/db/schema/auth";
import { env } from "@/env";
import {
  createAuthFoundationPlugins,
  createEmailAndPasswordOptions,
  createEmailVerificationOptions,
} from "@/lib/auth/auth-foundation";
import { sendEmail } from "@/lib/email/send-email";

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
  appName: env.APP_NAME,
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
  emailAndPassword: createEmailAndPasswordOptions({
    appName: env.APP_NAME,
    sendEmail,
  }),
  emailVerification: createEmailVerificationOptions({
    appName: env.APP_NAME,
    sendEmail,
  }),
  plugins: [
    oAuthProxy({
      productionURL: env.BETTER_AUTH_URL,
      secret: env.OAUTH_PROXY_SECRET,
    }),
    admin(),
    lastLoginMethod(),
    ...createAuthFoundationPlugins({
      appName: env.APP_NAME,
      baseURL: env.BETTER_AUTH_URL,
      sendEmail,
    }),
    testUtils(),
    dash({
      activityTracking: { enabled: true },
      apiKey: env.BETTER_AUTH_API_KEY,
    }),
    nextCookies(),
  ],
  rateLimit: {
    customRules: {
      "/ok": false,
      "/reference": false,
    },
    storage: "database",
  },
  secret: env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: "compact",
    },
  },
});

export { auth };
