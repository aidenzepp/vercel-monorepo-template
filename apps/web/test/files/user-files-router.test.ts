import { expect, mock, test } from "bun:test";

import { Files } from "files-sdk";
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
 * Constructs a private user-files gateway backed by deterministic memory data.
 *
 * @param user - The optional authenticated user exposed to authorization.
 * @returns The gateway and underlying file service used to observe requests.
 */
const createTestGateway = (
  user: {
    id: string;
    isAnonymous: boolean;
  } | null
) => {
  const files = new Files({
    adapter: memory({
      initial: {
        [`users/user_123/${AVATAR_KEY}`]: {
          body: "avatar bytes",
          contentType: "image/png",
        },
      },
    }),
  });
  const router = createUserFilesRouter({
    files,
    readSession: async () => {
      await Promise.resolve();
      return user === null ? null : { user };
    },
    secret: "test-files-router-secret-at-least-32-characters",
  });

  return { files, router };
};

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
