import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Vercel Blob environment shared by applications connected to a Blob store.
 *
 * The read-write token remains optional because the template's preferred
 * connection uses Vercel OIDC. The stable store identifier and webhook public
 * key still describe the connected store and are safe to validate at startup.
 *
 * @see https://vercel.com/docs/vercel-blob/using-blob-sdk
 * @see https://vercel.com/docs/oidc
 */
const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    BLOB_STORE_ID: z.string().min(1),
    BLOB_WEBHOOK_PUBLIC_KEY: z.string().min(1),
  },
});

export { env };
