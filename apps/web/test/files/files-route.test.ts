import { afterAll, expect, mock, test } from "bun:test";

import type {
  IssueSignedTokenOptions,
  IssuedSignedToken,
  PresignUrlOptions,
} from "@vercel/blob";
import { result } from "@workspace/utils/result";

/**
 * The Blob store identifier available throughout the production Function.
 */
const BLOB_STORE_ID = "store_test1234";

/**
 * The OIDC credential exposed only after a production request begins.
 */
const REQUEST_OIDC_TOKEN = "request-scoped-oidc-token";

/**
 * Whether the test has entered the production Function request lifecycle.
 */
let functionRequestStarted = false;

/**
 * The process credentials restored after exercising production-style OIDC.
 */
const ORIGINAL_BLOB_ENVIRONMENT = {
  oidcToken: process.env.VERCEL_OIDC_TOKEN,
  readWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
  storeId: process.env.BLOB_STORE_ID,
};

process.env.BLOB_STORE_ID = BLOB_STORE_ID;
delete process.env.BLOB_READ_WRITE_TOKEN;
delete process.env.VERCEL_OIDC_TOKEN;

afterAll(() => {
  process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_BLOB_ENVIRONMENT.readWriteToken;
  process.env.BLOB_STORE_ID = ORIGINAL_BLOB_ENVIRONMENT.storeId;
  process.env.VERCEL_OIDC_TOKEN = ORIGINAL_BLOB_ENVIRONMENT.oidcToken;
});

/**
 * Returns a provider delegation for a request-authenticated Blob operation.
 *
 * @param options - The credentials and upload constraints sent to Vercel Blob.
 * @returns A delegation accepted by the mocked presigning boundary.
 * @throws {Error} When the file service omits request-scoped credentials.
 */
const issueSignedToken = (
  options: IssueSignedTokenOptions
): IssuedSignedToken => {
  if (
    options.oidcToken !== REQUEST_OIDC_TOKEN ||
    options.storeId !== BLOB_STORE_ID
  ) {
    throw new Error("Blob signing requires request-scoped OIDC credentials.");
  }

  return {
    clientSigningToken: "client-signing-token",
    delegationToken: "delegation-token",
    validUntil: options.validUntil ?? Date.now() + 60_000,
  };
};

/**
 * Returns the direct storage target exposed by the test Blob boundary.
 *
 * @param _token - The delegation authorizing the upload.
 * @param _options - The signed operation and object-key constraints.
 * @returns A stable browser-direct upload URL.
 */
const presignUrl = (
  _token: Pick<IssuedSignedToken, "clientSigningToken" | "delegationToken">,
  _options: PresignUrlOptions & { access: "private" | "public" }
) => ({ presignedUrl: "https://blob.example/signed-upload" });

/**
 * Resolves OIDC only while a production Function request is being handled.
 *
 * @returns The request-scoped credential supplied by Vercel.
 * @throws {Error} When application initialization requests the credential.
 */
const getVercelOidcToken = async (): Promise<string> => {
  await Promise.resolve();

  if (!functionRequestStarted) {
    throw new Error("OIDC is unavailable before the Function request begins.");
  }

  return REQUEST_OIDC_TOKEN;
};

await mock.module("server-only", () => ({}));
await mock.module("@/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-files-router-secret-at-least-32-characters",
    BLOB_STORE_ID,
  },
}));
await mock.module("@/lib/auth/auth-server", () => ({
  auth: {
    api: {
      getSession: async () => {
        await Promise.resolve();
        return { user: { id: "user_123", isAnonymous: false } };
      },
    },
  },
}));
await mock.module("@vercel/blob", () => ({ issueSignedToken, presignUrl }));
await mock.module("@vercel/oidc", () => ({ getVercelOidcToken }));

/**
 * The route import captured so eager credential failures remain assertable.
 */
const routeModule = await result.trycatch(
  async () => await import("../../app/api/files/route")
);

test("resolves Blob OIDC after a production Function request begins", async () => {
  expect(routeModule.ok ? "loaded" : routeModule.error.message).toBe("loaded");

  if (!routeModule.ok) {
    return;
  }

  functionRequestStarted = true;
  const response = await routeModule.value.POST(
    new Request("https://app.templ8.dev/api/files?namespace=avatars", {
      body: JSON.stringify({
        files: [{ name: "avatar.png", size: 1024, type: "image/png" }],
        op: "presign",
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.templ8.dev",
      },
      method: "POST",
    })
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    uploads: [{ target: { url: "https://blob.example/signed-upload" } }],
  });
});
