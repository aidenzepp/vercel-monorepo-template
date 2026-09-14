import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Creates the Google OAuth environment preset shared by applications that use
 * Google's built-in Better Auth provider.
 *
 * @returns A validated Google OAuth credential preset for T3 Env composition.
 * @see https://www.better-auth.com/docs/authentication/google
 */
const google = () =>
  createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    runtimeEnv: process.env,
    server: {
      GOOGLE_CLIENT_ID: z.string().min(1),
      GOOGLE_CLIENT_SECRET: z.string().min(1),
    },
  });

export { google };
