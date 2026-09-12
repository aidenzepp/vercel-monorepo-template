import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Better Auth environment shared by applications that use the template's
 * authentication foundation.
 *
 * Keeping these variables together makes the runtime and schema-generation
 * entry points inherit one authentication contract without coupling the
 * provider-neutral Better Auth package to process configuration.
 *
 * @see https://www.better-auth.com/docs/installation
 * @see https://www.better-auth.com/docs/plugins/oauth-proxy
 */
const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    BETTER_AUTH_API_KEY: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    OAUTH_PROXY_SECRET: z.string().min(32),
  },
});

export { env };
