import { expect, test } from "bun:test";

import { uploadProfileAvatarFile } from "../../lib/files/profile-avatar";
import type { ProfileAvatarFileStore } from "../../lib/files/profile-avatar";

test("uploads an avatar to a user-scoped object and returns its private gateway URL", async () => {
  const uploads: {
    body: File;
    contentType: string;
    key: string;
  }[] = [];
  const store: ProfileAvatarFileStore & { url: () => never } = {
    upload: async (key, body, options) => {
      await Promise.resolve();
      uploads.push({ body, contentType: options.contentType, key });
      return { key };
    },
    url: () => {
      throw new Error("Private avatar uploads must not mint a Blob URL.");
    },
  };
  const avatar = new File(["avatar"], "portrait.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    files: store,
    isAnonymous: false,
    userId: "user_123",
  });

  expect(uploaded.ok).toBe(true);

  if (!uploaded.ok) {
    throw new Error("A valid avatar should return its uploaded URL.");
  }

  expect(uploaded.value.url).toMatch(
    /^\/api\/files\?op=download&key=avatars%2F[0-9a-f-]+\.png$/u
  );
  expect(uploads).toHaveLength(1);
  expect(uploads[0]?.body).toBe(avatar);
  expect(uploads[0]?.contentType).toBe("image/png");
  expect(uploads[0]?.key).toMatch(
    /^users\/user_123\/avatars\/[0-9a-f-]+\.png$/u
  );
});

test("rejects avatar uploads for anonymous users before storage", async () => {
  const store = {
    upload: () => {
      throw new Error("Anonymous avatars must not reach Blob storage.");
    },
    url: () => {
      throw new Error("Anonymous avatars have no read URL.");
    },
  };
  const options = {
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    files: store,
    isAnonymous: true,
    userId: "anonymous_123",
  };

  const uploaded = await uploadProfileAvatarFile(options);

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error(
      "An anonymous avatar should return an authorization error."
    );
  }

  expect(uploaded.error.message).toBe(
    "Temporary accounts cannot upload an avatar."
  );
});

test("rejects unsupported avatar formats before storage", async () => {
  const store: ProfileAvatarFileStore = {
    upload: () => {
      throw new Error("Invalid avatars must not reach Blob storage.");
    },
  };
  const avatar = new File(["avatar"], "portrait.svg", {
    type: "image/svg+xml",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    files: store,
    isAnonymous: false,
    userId: "user_123",
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An unsupported avatar should return a validation error.");
  }

  expect(uploaded.error.message).toBe("Choose a JPEG, PNG, or WebP image.");
});

test("rejects avatars larger than five mebibytes before storage", async () => {
  const store: ProfileAvatarFileStore = {
    upload: () => {
      throw new Error("Oversized avatars must not reach Blob storage.");
    },
  };
  const avatar = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    files: store,
    isAnonymous: false,
    userId: "user_123",
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An oversized avatar should return a validation error.");
  }

  expect(uploaded.error.message).toBe(
    "Choose an image that’s 5 MB or smaller."
  );
});

test("preserves the storage failure behind useful profile repair guidance", async () => {
  const providerError = new Error(
    "Vercel Blob: Access denied, please provide a valid token for this resource."
  );
  const store: ProfileAvatarFileStore = {
    upload: async () => {
      await Promise.resolve();
      throw providerError;
    },
  };

  const uploaded = await uploadProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    files: store,
    isAnonymous: false,
    userId: "user_123",
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("A provider failure should return repair guidance.");
  }

  expect(uploaded.error.message).toBe(
    "Avatar uploads are unavailable right now. Your other profile changes were saved, and the selected image is still here."
  );
  expect(uploaded.error.cause).toBe(providerError);
});
