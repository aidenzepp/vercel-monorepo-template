import { expect, mock, test } from "bun:test";

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

const { auth } = await import("./auth-server");

await auth.$context;

test("configures a provider-neutral auth runtime", () => {
  expect("emailAndPassword" in auth.options).toBe(false);
  expect("socialProviders" in auth.options).toBe(false);
  expect(auth.options.account).toEqual({ encryptOAuthTokens: true });
  expect(auth.options.advanced).toMatchObject({ database: { joins: true } });
  expect(auth.options.plugins?.map((plugin) => plugin.id)).toEqual([
    "oauth-proxy",
    "next-cookies",
  ]);
});
