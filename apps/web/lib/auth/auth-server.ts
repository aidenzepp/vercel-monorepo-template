import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import type { BetterAuthOptions } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins";
import type { Auth } from "better-auth/types";

import { db } from "@/db/client";
import { authSchema } from "@/db/schema/auth";
import { env } from "@/env";

const authConfig: BetterAuthOptions = {
  account: { encryptOAuthTokens: true },
  advanced: { database: { joins: true } },
  baseURL: {
    allowedHosts: ["localhost:*", "127.0.0.1:*", "*.vercel.app"],
    fallback: env.BETTER_AUTH_URL,
    protocol: "auto",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
    schemaName: "auth",
  }),
  plugins: [
    oAuthProxy({
      productionURL: env.BETTER_AUTH_URL,
      secret: env.OAUTH_PROXY_SECRET,
    }),
    nextCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET,
};

const auth: Auth = betterAuth(authConfig);

export { auth };
