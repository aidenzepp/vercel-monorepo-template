import { expect, test } from "bun:test";

import { uploadProfileAvatarFile } from "../../lib/files/profile-avatar";

test("uploads a canonical avatar file and returns its private gateway URL", async () => {
  const uploads: File[] = [];
  const avatar = new File(["avatar"], "portrait.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: async (file) => {
      await Promise.resolve();
      uploads.push(file);
      return {
        key: "12345678-9abc-4def-8abc-123456789abc.png",
      };
    },
  });

  expect(uploaded.ok).toBe(true);

  if (!uploaded.ok) {
    throw new Error("A valid avatar should return its uploaded URL.");
  }

  expect(uploaded.value.url).toBe(
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png"
  );
  expect(uploads).toHaveLength(1);
  expect(uploads[0]?.name).toBe("avatar.png");
  expect(uploads[0]?.size).toBe(avatar.size);
  expect(uploads[0]?.type).toBe("image/png");
});

test("rejects unsupported avatar formats before requesting an upload", async () => {
  const avatar = new File(["avatar"], "portrait.svg", {
    type: "image/svg+xml",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: () => {
      throw new Error("Invalid avatars must not reach Blob storage.");
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An unsupported avatar should return a validation error.");
  }

  expect(uploaded.error.message).toBe("Choose a JPEG, PNG, or WebP image.");
});

test("rejects avatars larger than five mebibytes before requesting an upload", async () => {
  const avatar = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: () => {
      throw new Error("Oversized avatars must not reach Blob storage.");
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An oversized avatar should return a validation error.");
  }

  expect(uploaded.error.message).toBe(
    "Choose an image that’s 5 MB or smaller."
  );
});

test("preserves a direct-upload failure behind useful profile repair guidance", async () => {
  const providerError = new Error(
    "Vercel Blob: Access denied, please provide a valid token for this resource."
  );

  const uploaded = await uploadProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    upload: async () => {
      await Promise.resolve();
      throw providerError;
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("A provider failure should return repair guidance.");
  }

  expect(uploaded.error.message).toBe(
    "We couldn’t upload that image. Your other profile changes were saved, and the selected image is still here. Check your connection, then save again."
  );
  expect(uploaded.error.cause).toBe(providerError);
});

test("rejects an uploaded key outside the generated avatar grammar", async () => {
  const uploaded = await uploadProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    upload: async () => {
      await Promise.resolve();
      return { key: "documents/profile.png" };
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An unexpected upload key should fail closed.");
  }

  expect(uploaded.error.message).toBe(
    "The image reached storage, but its saved location was invalid. The selected image is still here. Save again to retry."
  );
});
