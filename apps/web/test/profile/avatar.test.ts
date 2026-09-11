import { describe, expect, test } from "bun:test";

import {
  createAvatarPathname,
  parseGoogleAvatarUrl,
  parseOwnedPrivateAvatarUrl,
} from "../../lib/profile/avatar";

describe("avatar storage policy", () => {
  test("creates one user-scoped pathname per supported content type", () => {
    expect(createAvatarPathname("user/one", "image/jpeg", "avatar-id")).toBe(
      "users/user%2Fone/avatar/avatar-id.jpg"
    );
    expect(createAvatarPathname("user/one", "image/png", "avatar-id")).toBe(
      "users/user%2Fone/avatar/avatar-id.png"
    );
    expect(createAvatarPathname("user/one", "image/webp", "avatar-id")).toBe(
      "users/user%2Fone/avatar/avatar-id.webp"
    );
  });

  test("accepts only an owned private Blob avatar", () => {
    expect(
      parseOwnedPrivateAvatarUrl(
        "https://store.private.blob.vercel-storage.com/users/user%2Fone/avatar/avatar-random123.webp",
        "user/one"
      )?.pathname
    ).toBe("/users/user%2Fone/avatar/avatar-random123.webp");

    expect(
      parseOwnedPrivateAvatarUrl(
        "https://store.private.blob.vercel-storage.com/users/user%2Fone/avatar/123e4567-e89b-42d3-a456-426614174000.webp",
        "user/one"
      )?.pathname
    ).toBe(
      "/users/user%2Fone/avatar/123e4567-e89b-42d3-a456-426614174000.webp"
    );

    expect(
      parseOwnedPrivateAvatarUrl(
        "https://store.private.blob.vercel-storage.com/users/other/avatar/avatar-random123.webp",
        "user/one"
      )
    ).toBeNull();
    expect(
      parseOwnedPrivateAvatarUrl(
        "https://store.public.blob.vercel-storage.com/users/user%2Fone/avatar/avatar-random123.webp",
        "user/one"
      )
    ).toBeNull();
    expect(
      parseOwnedPrivateAvatarUrl(
        "https://example.com/users/user%2Fone/avatar/avatar-random123.webp",
        "user/one"
      )
    ).toBeNull();
  });

  test("allows the configured Google OAuth image host only", () => {
    expect(
      parseGoogleAvatarUrl("https://lh3.googleusercontent.com/a/example")
        ?.hostname
    ).toBe("lh3.googleusercontent.com");
    expect(
      parseGoogleAvatarUrl("https://googleusercontent.com/a/example")
    ).toBeNull();
  });
});
