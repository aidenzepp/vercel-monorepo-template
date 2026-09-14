import { expect, mock, test } from "bun:test";

import { Files } from "files-sdk";
import type { SignUploadOptions } from "files-sdk";
import { createFilesClient } from "files-sdk/client";
import { memory } from "files-sdk/memory";

await mock.module("server-only", () => ({}));

/**
 * User-files router loaded after its server-only guard is replaced in tests.
 */
const { createUserFilesRouter } =
  await import("../../lib/files/user-files-router");

/**
 * The caller-facing avatar key used by private gateway tests.
 */
const AVATAR_KEY = "avatars/01234567-89ab-4cde-8fab-0123456789ab.png";

/**
 * One signed storage target requested by the user-files gateway.
 */
interface SignedUploadRequest {
  key: string;
  options: SignUploadOptions;
}

/**
 * Constructs a private user-files gateway backed by deterministic memory data.
 *
 * @param user - The optional authenticated user exposed to authorization.
 * @param gatewayOptions - Optional provider failures injected by a test.
 * @returns The gateway and underlying file service used to observe requests.
 */
const createTestGateway = (
  user: {
    id: string;
    isAnonymous: boolean;
  } | null,
  gatewayOptions: { signedUploadError?: Error } = {}
) => {
  const signedUploads: SignedUploadRequest[] = [];
  const adapter = memory({
    initial: {
      [`users/user_123/${AVATAR_KEY}`]: {
        body: "avatar bytes",
        contentType: "image/png",
      },
    },
  });
  const files = new Files({
    adapter: {
      ...adapter,
      signedUploadUrl: async (key, uploadOptions) => {
        await Promise.resolve();

        if (gatewayOptions.signedUploadError !== undefined) {
          throw gatewayOptions.signedUploadError;
        }

        signedUploads.push({ key, options: uploadOptions });
        return {
          headers: { "Content-Type": uploadOptions.contentType ?? "" },
          method: "PUT" as const,
          url: `https://blob.example/upload/${encodeURIComponent(key)}`,
        };
      },
      signedUrl: { supported: true },
    },
  });
  const router = createUserFilesRouter({
    files,
    readSession: async () => {
      await Promise.resolve();
      return user === null ? null : { user };
    },
    secret: "test-files-router-secret-at-least-32-characters",
  });

  return { files, router, signedUploads };
};

/**
 * Constructs the metadata request that starts one avatar upload.
 *
 * @param file - The browser-reported name, size, and media type.
 * @returns A same-origin Files SDK presign request for the avatar namespace.
 */
const createAvatarPresignRequest = (file: {
  name: string;
  size: number;
  type: string;
}): Request =>
  new Request("http://localhost/api/files?namespace=avatars", {
    body: JSON.stringify({ files: [file], op: "presign" }),
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
    },
    method: "POST",
  });

test("proxies an authenticated user's avatar inline from their storage prefix", async () => {
  const { router } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });
  const request = new Request(
    `http://localhost/api/files?op=download&key=${encodeURIComponent(AVATAR_KEY)}`
  );

  const response = await router.handle(request);

  expect(response.status).toBe(200);
  expect(response.headers.get("content-disposition")).toBe("inline");
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("vary")).toContain("Cookie");
  expect(await response.text()).toBe("avatar bytes");
});

test("does not let one user address another user's avatar", async () => {
  const { router } = createTestGateway({
    id: "user_456",
    isAnonymous: false,
  });
  const request = new Request(
    `http://localhost/api/files?op=download&key=${encodeURIComponent(AVATAR_KEY)}`
  );

  const response = await router.handle(request);

  expect(response.status).toBe(404);
});

test("rejects unknown user-file namespaces before reading storage", async () => {
  const { router } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });
  const request = new Request(
    "http://localhost/api/files?op=download&key=documents%2Freport.html"
  );

  const response = await router.handle(request);

  expect(response.status).toBe(404);
});

test("rejects malformed keys inside the avatar namespace", async () => {
  const { router } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });
  const request = new Request(
    "http://localhost/api/files?op=download&key=avatars%2Fprofile.svg"
  );

  const response = await router.handle(request);

  expect(response.status).toBe(404);
});

test("rejects private file reads from anonymous accounts", async () => {
  const { router } = createTestGateway({
    id: "anonymous_123",
    isAnonymous: true,
  });
  const request = new Request(
    `http://localhost/api/files?op=download&key=${encodeURIComponent(AVATAR_KEY)}`
  );

  const response = await router.handle(request);

  expect(response.status).toBe(401);
});

test("rejects private file reads without a session", async () => {
  const { router } = createTestGateway(null);
  const request = new Request(
    `http://localhost/api/files?op=download&key=${encodeURIComponent(AVATAR_KEY)}`
  );

  const response = await router.handle(request);

  expect(response.status).toBe(401);
});

test("rejects writes even for an authenticated user", async () => {
  const { files, router } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });
  const request = new Request("http://localhost/api/files", {
    body: JSON.stringify({ key: AVATAR_KEY, op: "delete" }),
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
    },
    method: "POST",
  });

  const response = await router.handle(request);

  expect(response.status).toBe(403);
  expect(await files.exists(`users/user_123/${AVATAR_KEY}`)).toBe(true);
});

test("uploads an avatar directly under the authenticated user's avatar prefix", async () => {
  const { files, router, signedUploads } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });
  /**
   * Routes Files SDK metadata requests through the in-memory test gateway.
   *
   * @param input - The gateway URL or request created by the client.
   * @param init - The method, headers, and JSON body for the request.
   * @returns The real gateway response consumed by the Files SDK client.
   */
  const gatewayFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => await router.handle(new Request(input, init));
  gatewayFetch.preconnect = fetch.preconnect;
  const client = createFilesClient({
    endpoint: "http://localhost/api/files?namespace=avatars",
    fetchImpl: gatewayFetch,
    transport: async (request) => {
      const signed = signedUploads.at(-1);

      if (signed === undefined || !(request.body instanceof Blob)) {
        throw new Error("A signed avatar upload should send Blob bytes.");
      }

      expect(request.url).toBe(
        `https://blob.example/upload/${encodeURIComponent(signed.key)}`
      );
      await files.upload(signed.key, request.body, {
        contentType: request.headers?.["Content-Type"],
      });
      return { status: 200, text: "" };
    },
  });
  const avatar = new File([new Uint8Array(2 * 1024 * 1024)], "avatar.png", {
    type: "image/png",
  });

  const uploaded = await client.upload(avatar);

  expect(uploaded.key).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/u
  );
  expect(uploaded.size).toBe(avatar.size);
  expect(uploaded.type).toBe("image/png");
  expect(signedUploads).toHaveLength(1);
  expect(signedUploads[0]?.key).toBe(`users/user_123/avatars/${uploaded.key}`);
  expect(signedUploads[0]?.options).toMatchObject({
    contentType: "image/png",
    expiresIn: 60,
    maxSize: 5 * 1024 * 1024,
    minSize: 0,
  });
  expect(await files.exists(`users/user_123/avatars/${uploaded.key}`)).toBe(
    true
  );
});

test("does not fall back to an application upload when signing fails", async () => {
  const { router, signedUploads } = createTestGateway(
    { id: "user_123", isAnonymous: false },
    { signedUploadError: new Error("signed target exploded") }
  );

  const response = await router.handle(
    createAvatarPresignRequest({
      name: "avatar.png",
      size: 1024,
      type: "image/png",
    })
  );

  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: {
      code: "Provider",
      message: "Direct file uploads are temporarily unavailable.",
    },
  });
  expect(signedUploads).toHaveLength(0);
});

test("lets an owner reconcile metadata for a canonical avatar key", async () => {
  const { router } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });
  const request = new Request("http://localhost/api/files?namespace=avatars", {
    body: JSON.stringify({ key: AVATAR_KEY, op: "head" }),
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
    },
    method: "POST",
  });

  const response = await router.handle(request);

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    file: { key: AVATAR_KEY, size: 12, type: "image/png" },
  });
});

test("rejects unsupported avatar metadata before signing storage access", async () => {
  const { router, signedUploads } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });

  const response = await router.handle(
    createAvatarPresignRequest({
      name: "profile.svg",
      size: 1024,
      type: "image/svg+xml",
    })
  );

  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    error: {
      code: "Validation",
      details: {
        acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
        actualType: "image/svg+xml",
      },
      message: "Choose a JPEG, PNG, or WebP image.",
      reason: "unsupported_type",
    },
  });
  expect(signedUploads).toHaveLength(0);
});

test("rejects oversized avatar metadata before signing storage access", async () => {
  const { router, signedUploads } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });

  const response = await router.handle(
    createAvatarPresignRequest({
      name: "profile.png",
      size: 5 * 1024 * 1024 + 1,
      type: "image/png",
    })
  );

  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    error: {
      code: "Validation",
      details: {
        actualBytes: 5 * 1024 * 1024 + 1,
        maxBytes: 5 * 1024 * 1024,
      },
      message: "Choose an image that’s 5 MiB or smaller.",
      reason: "too_large",
    },
  });
  expect(signedUploads).toHaveLength(0);
});

test("identifies a filename and media-type mismatch before signing", async () => {
  const { router, signedUploads } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });

  const response = await router.handle(
    createAvatarPresignRequest({
      name: "profile.jpg",
      size: 1024,
      type: "image/png",
    })
  );

  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    error: {
      code: "Validation",
      details: { actualName: "profile.jpg", expectedExtension: "png" },
      message: "The image filename does not match its selected format.",
      reason: "filename_type_mismatch",
    },
  });
  expect(signedUploads).toHaveLength(0);
});

test("rejects avatar upload requests from anonymous accounts", async () => {
  const { router, signedUploads } = createTestGateway({
    id: "anonymous_123",
    isAnonymous: true,
  });

  const response = await router.handle(
    createAvatarPresignRequest({
      name: "avatar.png",
      size: 1024,
      type: "image/png",
    })
  );

  expect(response.status).toBe(401);
  expect(signedUploads).toHaveLength(0);
});

test("rejects file bytes sent through the application gateway", async () => {
  const { router } = createTestGateway({
    id: "user_123",
    isAnonymous: false,
  });
  const request = new Request(
    `http://localhost/api/files?op=upload&key=${encodeURIComponent(AVATAR_KEY)}`,
    {
      body: new Uint8Array([1, 2, 3]),
      headers: {
        "content-type": "image/png",
        origin: "http://localhost",
      },
      method: "PUT",
    }
  );

  const response = await router.handle(request);

  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({
    error: {
      code: "Forbidden",
      message: "Upload image bytes directly to the signed storage target.",
    },
  });
});
