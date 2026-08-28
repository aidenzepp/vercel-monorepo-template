import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import type { BetterAuthOptions } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  lastLoginMethod,
  oAuthProxy,
  testUtils,
} from "better-auth/plugins";
import type { Auth } from "better-auth/types";

import { db } from "@/db/client";
import * as schema from "@/db/schema/auth";
import { env } from "@/env";

const authConfig: BetterAuthOptions = {
  account: { encryptOAuthTokens: true },
  advanced: {
    database: { joins: true },
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
  },
  baseURL: {
    allowedHosts: ["localhost:*", "127.0.0.1:*", "*.vercel.app"],
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
    ...(env.NODE_ENV === "test" ? [testUtils()] : []),
    nextCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET,
};

const auth: Auth = betterAuth(authConfig);

export { auth };
