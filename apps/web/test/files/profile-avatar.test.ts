import { expect, test } from "bun:test";

import { uploadProfileAvatarFile } from "../../lib/files/profile-avatar";
import type { ProfileAvatarFileStore } from "../../lib/files/profile-avatar";

test("uploads an avatar to a user-scoped object and returns its public URL", async () => {
  const uploads: {
    body: File;
    contentType: string;
    key: string;
  }[] = [];
  const store: ProfileAvatarFileStore = {
    upload: async (key, body, options) => {
      await Promise.resolve();
      uploads.push({ body, contentType: options.contentType, key });
      return { key };
    },
    url: async (key) => {
      await Promise.resolve();
      return `https://assets.public.blob.vercel-storage.com/${key}`;
    },
  };
  const avatar = new File(["avatar"], "portrait.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    files: store,
    userId: "user_123",
  });

  expect(uploaded.ok).toBe(true);

  if (!uploaded.ok) {
    throw new Error("A valid avatar should return its uploaded URL.");
  }

  expect(uploaded.url).toMatch(
    /^https:\/\/assets\.public\.blob\.vercel-storage\.com\/users\/user_123\/avatars\/[0-9a-f-]+\.png$/u
  );
  expect(uploads).toHaveLength(1);
  expect(uploads[0]?.body).toBe(avatar);
  expect(uploads[0]?.contentType).toBe("image/png");
  expect(uploads[0]?.key).toMatch(
    /^users\/user_123\/avatars\/[0-9a-f-]+\.png$/u
  );
});

test("rejects unsupported avatar formats before storage", async () => {
  const store: ProfileAvatarFileStore = {
    upload: () => {
      throw new Error("Invalid avatars must not reach Blob storage.");
    },
    url: () => {
      throw new Error("Invalid avatars have no public URL.");
    },
  };
  const avatar = new File(["avatar"], "portrait.svg", {
    type: "image/svg+xml",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    files: store,
    userId: "user_123",
  });

  expect(uploaded).toEqual({
    message: "Choose a JPEG, PNG, or WebP image.",
    ok: false,
  });
});

test("rejects avatars larger than five mebibytes before storage", async () => {
  const store: ProfileAvatarFileStore = {
    upload: () => {
      throw new Error("Oversized avatars must not reach Blob storage.");
    },
    url: () => {
      throw new Error("Oversized avatars have no public URL.");
    },
  };
  const avatar = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    files: store,
    userId: "user_123",
  });

  expect(uploaded).toEqual({
    message: "Choose an image that’s 5 MB or smaller.",
    ok: false,
  });
});
