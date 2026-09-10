import { z } from "zod";

const MAXIMUM_AVATAR_SIZE_IN_BYTES = 5 * 1024 * 1024;

const AVATAR_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const avatarContentTypeSchema = z.enum(AVATAR_CONTENT_TYPES);

type AvatarContentType = z.infer<typeof avatarContentTypeSchema>;

const EXTENSION_BY_CONTENT_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const satisfies Record<AvatarContentType, string>;

/** A browser-selected avatar that is safe to authorize for private storage. */
const avatarFileSchema = z
  .custom<File>(
    // oxlint-disable-next-line anti-slop/no-runtime-typeof -- File is absent during server rendering.
    (value) => typeof File !== "undefined" && value instanceof File,
    "Choose an image."
  )
  .refine((file) => file.size > 0, "The image cannot be empty.")
  .refine(
    (file) => avatarContentTypeSchema.safeParse(file.type).success,
    "Choose a JPEG, PNG, or WebP image."
  )
  .refine(
    (file) => file.size <= MAXIMUM_AVATAR_SIZE_IN_BYTES,
    "Choose an image no larger than 5 MB."
  );

/** Returns the only client-upload pathname authorized for this user and type. */
const createAvatarPathname = (
  userId: string,
  contentType: AvatarContentType
): string =>
  `users/${encodeURIComponent(userId)}/avatar/avatar.${EXTENSION_BY_CONTENT_TYPE[contentType]}`;

/**
 * Accepts only a private Blob URL within the current user's avatar namespace.
 * The optional suffix is the random value Vercel adds after token issuance.
 */
const parseOwnedPrivateAvatarUrl = (
  value: string,
  userId: string
): URL | null => {
  if (!URL.canParse(value)) {
    return null;
  }

  const url = new URL(value);
  const prefix = `/users/${encodeURIComponent(userId)}/avatar/`;
  const filename = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length)
    : "";
  const isPrivateBlobHost =
    url.hostname.endsWith(".private.blob.vercel-storage.com") &&
    url.hostname !== ".private.blob.vercel-storage.com";
  const isAvatarFilename = /^avatar(?:-[A-Za-z0-9]+)?\.(?:jpg|png|webp)$/u.test(
    filename
  );

  if (
    url.protocol !== "https:" ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    !isPrivateBlobHost ||
    !isAvatarFilename
  ) {
    return null;
  }

  return url;
};

/** Google-hosted OAuth avatars are the only public remote image exception. */
const parseGoogleAvatarUrl = (value: string): URL | null => {
  if (!URL.canParse(value)) {
    return null;
  }

  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "lh3.googleusercontent.com" ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== ""
  ) {
    return null;
  }

  return url;
};

export {
  AVATAR_CONTENT_TYPES,
  avatarContentTypeSchema,
  avatarFileSchema,
  createAvatarPathname,
  MAXIMUM_AVATAR_SIZE_IN_BYTES,
  parseGoogleAvatarUrl,
  parseOwnedPrivateAvatarUrl,
};
export type { AvatarContentType };
