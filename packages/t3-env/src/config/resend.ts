import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Creates the Resend environment preset shared by applications that send from
 * a verified domain.
 *
 * The domain is stored as a hostname rather than a URL because callers use it
 * to construct sender addresses such as `notifications@example.com`.
 *
 * @returns A validated Resend environment preset for T3 Env composition.
 * @see https://resend.com/docs/api-reference/introduction
 * @see https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend
 */
const resend = () =>
  createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
    server: {
      RESEND_API_KEY: z.string().min(1),
      RESEND_EMAIL_DOMAIN: z.hostname(),
    },
  });

export { resend };
