import { createEnv } from "@t3-oss/env-nextjs";
import { neonVercel, vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

/**
 * Validated server environment owned by the authenticated web application.
 */
export const env = createEnv({
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
  extends: [vercel(), neonVercel()],
  server: {
    BETTER_AUTH_API_KEY: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    BLOB_STORE_ID: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    OAUTH_PROXY_SECRET: z.string().min(32),
    RESEND_API_KEY: z.string().min(1).optional(),
  },
});
