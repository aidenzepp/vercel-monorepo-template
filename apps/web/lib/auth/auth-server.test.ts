import { expect, mock, test } from "bun:test";

import type { DrizzleAdapterConfig } from "@better-auth/drizzle-adapter";

import * as authSchema from "@/db/schema/auth";

type DrizzleDatabase = Record<string, never>;

let drizzleAdapterConfig: DrizzleAdapterConfig | undefined;

await mock.module("server-only", () => ({}));
await mock.module("@/db/client", () => ({ db: {} }));
await mock.module("@/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "12345678901234567890123456789012",
    BETTER_AUTH_URL: "https://example.com",
    NODE_ENV: "test",
    OAUTH_PROXY_SECRET: "abcdefghijklmnopqrstuvwxyz123456",
  },
}));
await mock.module("@better-auth/drizzle-adapter", () => ({
  drizzleAdapter: (
    _database: DrizzleDatabase,
    config: DrizzleAdapterConfig
  ) => {
    drizzleAdapterConfig = config;
    return () => ({
      transaction: async () => {
        await Promise.resolve();
      },
    });
  },
}));

const { auth } = await import("./auth-server");

test("configures a provider-neutral auth runtime", () => {
  expect(drizzleAdapterConfig).toEqual({
    provider: "pg",
    schema: authSchema,
    schemaName: "auth",
    usePlural: false,
  });
  expect(Object.keys(drizzleAdapterConfig?.schema ?? {})).toEqual([
    "account",
    "accountRelations",
    "authSchema",
    "session",
    "sessionRelations",
    "user",
    "userRelations",
    "verification",
  ]);
  expect(drizzleAdapterConfig?.schema).toMatchObject({
    account: authSchema.account,
    accountRelations: authSchema.accountRelations,
    session: authSchema.session,
    sessionRelations: authSchema.sessionRelations,
    user: authSchema.user,
    userRelations: authSchema.userRelations,
    verification: authSchema.verification,
  });
  expect("emailAndPassword" in auth.options).toBe(false);
  expect("socialProviders" in auth.options).toBe(false);
  expect(auth.options.account).toEqual({ encryptOAuthTokens: true });
  expect(auth.options.advanced).toMatchObject({ database: { joins: true } });
  expect(auth.options.plugins?.map((plugin) => plugin.id)).toEqual([
    "oauth-proxy",
    "next-cookies",
  ]);
});
