import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Creates the Vercel Blob environment preset shared by applications connected
 * to a Blob store.
 *
 * The read-write token remains optional because the template's preferred
 * connection uses Vercel OIDC. The stable store identifier and webhook public
 * key still describe the connected store and are safe to validate at startup.
 *
 * @returns A validated Vercel Blob environment preset for T3 Env composition.
 * @see https://vercel.com/docs/vercel-blob/using-blob-sdk
 * @see https://vercel.com/docs/oidc
 */
const vercelBlob = () =>
  createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
    server: {
      BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
      BLOB_STORE_ID: z.string().min(1),
      BLOB_WEBHOOK_PUBLIC_KEY: z.string().min(1),
    },
  });

export { vercelBlob };
