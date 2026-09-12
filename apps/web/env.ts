import { createEnv } from "@t3-oss/env-nextjs";
import { neonVercel, vercel } from "@t3-oss/env-nextjs/presets-zod";
import { betterAuth } from "@workspace/t3-env/config/better-auth";
import { resend } from "@workspace/t3-env/config/resend";
import { vercelBlob } from "@workspace/t3-env/config/vercel-blob";
import { z } from "zod";

/**
 * Validated server environment owned by the authenticated web application.
 *
 * Provider contracts stay composable so another application can adopt only
 * the infrastructure it owns without copying schemas from this entry point.
 *
 * @see https://env.t3.gg/docs/customization#extending-presets
 */
export const env = createEnv({
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
  extends: [vercel(), neonVercel(), betterAuth(), resend(), vercelBlob()],
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
});
