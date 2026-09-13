import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";

/**
 * The largest avatar accepted by both profile validation and Blob storage.
 */
const MAX_AVATAR_SIZE_IN_BYTES = 5 * 1024 * 1024;

/**
 * The Files SDK endpoint used to project private avatar objects to the owner.
 */
const PROFILE_AVATAR_ENDPOINT = "/api/files";

/**
 * The caller-facing avatar namespace and generated filename grammar.
 */
const PROFILE_AVATAR_KEY_PATTERN =
  /^avatars\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/u;

/**
 * A canonical extension accepted for a stored profile avatar.
 */
type ProfileAvatarExtension = "jpg" | "png" | "webp";

/**
 * The file operations required to store one profile avatar.
 */
interface ProfileAvatarFileStore {
  /**
   * Stores an avatar under its application-owned object key.
   *
   * @param key - The object key reserved for the avatar.
   * @param body - The validated image selected by the user.
   * @param options - The content metadata persisted with the image.
   * @returns The stored object's canonical key.
   */
  upload: (
    key: string,
    body: File,
    options: { contentType: string }
  ) => Promise<{ key: string }>;
}

/**
 * Values required to store one authenticated user's selected avatar.
 */
interface UploadProfileAvatarFileOptions {
  file: File;
  files: ProfileAvatarFileStore;
  isAnonymous: boolean;
  userId: string;
}

/**
 * The typed outcome of validating and storing a selected profile avatar.
 */
type ProfileAvatarUploadResult = Result<{ url: string }>;

/**
 * Maps an accepted avatar media type to its canonical filename extension.
 *
 * @param contentType - The browser-reported media type for the selected file.
 * @returns The matching extension, or `null` when the format is unsupported.
 */
const getAvatarFileExtension = (
  contentType: string
): ProfileAvatarExtension | null => {
  switch (contentType) {
    case "image/jpeg": {
      return "jpg";
    }
    case "image/png": {
      return "png";
    }
    case "image/webp": {
      return "webp";
    }
    default: {
      return null;
    }
  }
};

/**
 * Constructs a generated caller-facing key inside the avatar namespace.
 *
 * @param extension - The canonical extension selected from validated media.
 * @returns The relative key accepted by the private user-files gateway.
 */
const createProfileAvatarKey = (extension: ProfileAvatarExtension): string =>
  `avatars/${crypto.randomUUID()}.${extension}`;

/**
 * Constructs the stable application URL used to read one private avatar.
 *
 * @param key - The caller-facing key inside the avatar namespace.
 * @returns The relative URL stored on the Better Auth user.
 */
const createProfileAvatarUrl = (key: string): string => {
  const parameters = new URLSearchParams();
  parameters.set("op", "download");
  parameters.set("key", key);
  return `${PROFILE_AVATAR_ENDPOINT}?${parameters.toString()}`;
};

/**
 * Determines whether an untrusted key names a generated profile avatar.
 *
 * @param key - The caller-facing key supplied through the files gateway.
 * @returns True only for a supported avatar namespace and filename.
 */
const isProfileAvatarKey = (key: string): boolean =>
  PROFILE_AVATAR_KEY_PATTERN.test(key);

/**
 * Validates and stores a selected avatar under a user-scoped object key.
 *
 * @param options - The image, authenticated owner, and file-store capability.
 * @param options.file - Supplies the browser-selected image.
 * @param options.files - Stores the image under its owner-scoped key.
 * @param options.isAnonymous - Whether the current identity is temporary.
 * @param options.userId - Scopes the object key to the authenticated owner.
 * @returns The stable private gateway URL or repair guidance for the image.
 */
const uploadProfileAvatarFile = async (
  options: UploadProfileAvatarFileOptions
): Promise<ProfileAvatarUploadResult> => {
  if (options.isAnonymous) {
    return result.fail(
      new Error("Temporary accounts cannot upload an avatar.")
    );
  }

  const extension = getAvatarFileExtension(options.file.type);

  if (extension === null) {
    return result.fail(new Error("Choose a JPEG, PNG, or WebP image."));
  }

  if (options.file.size > MAX_AVATAR_SIZE_IN_BYTES) {
    return result.fail(new Error("Choose an image that’s 5 MB or smaller."));
  }

  const key = createProfileAvatarKey(extension);
  const storageKey = `users/${options.userId}/${key}`;
  const uploaded = await result.trycatch(
    async () =>
      await options.files.upload(storageKey, options.file, {
        contentType: options.file.type,
      })
  );

  if (!uploaded.ok) {
    return result.fail(
      new Error(
        "Avatar uploads are unavailable right now. Your other profile changes were saved, and the selected image is still here.",
        { cause: uploaded.error }
      )
    );
  }

  return result.pass({ url: createProfileAvatarUrl(key) });
};

export { isProfileAvatarKey, uploadProfileAvatarFile };
export type { ProfileAvatarFileStore, ProfileAvatarUploadResult };
