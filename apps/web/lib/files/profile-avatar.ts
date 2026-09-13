import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";

/**
 * The largest avatar accepted by both profile validation and Blob storage.
 */
const MAX_AVATAR_SIZE_IN_BYTES = 5 * 1024 * 1024;

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

  /**
   * Resolves a stored object key to its permanent public URL.
   *
   * @param key - The canonical key returned after upload.
   * @returns The URL safe to store on the Better Auth user.
   */
  url: (key: string) => Promise<string>;
}

/**
 * Values required to store one authenticated user's selected avatar.
 */
interface UploadProfileAvatarFileOptions {
  file: File;
  files: ProfileAvatarFileStore;
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
const getAvatarFileExtension = (contentType: string): string | null => {
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
 * Validates and stores a selected avatar under a user-scoped object key.
 *
 * @param options - The image, authenticated owner, and file-store capability.
 * @param options.file - Supplies the browser-selected image.
 * @param options.files - Stores the image and resolves its public URL.
 * @param options.userId - Scopes the object key to the authenticated owner.
 * @returns The permanent avatar URL or repair guidance for an invalid image.
 */
const uploadProfileAvatarFile = async (
  options: UploadProfileAvatarFileOptions
): Promise<ProfileAvatarUploadResult> => {
  const extension = getAvatarFileExtension(options.file.type);

  if (extension === null) {
    return result.fail(new Error("Choose a JPEG, PNG, or WebP image."));
  }

  if (options.file.size > MAX_AVATAR_SIZE_IN_BYTES) {
    return result.fail(new Error("Choose an image that’s 5 MB or smaller."));
  }

  const key = `users/${options.userId}/avatars/${crypto.randomUUID()}.${extension}`;
  const uploaded = await result.trycatch(
    async () =>
      await options.files.upload(key, options.file, {
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

  const avatarUrl = await result.trycatch(
    async () => await options.files.url(uploaded.value.key)
  );

  if (!avatarUrl.ok) {
    return result.fail(
      new Error(
        "The image uploaded, but we couldn’t attach it to your profile. Your other profile changes were saved, and the selected image is still here.",
        { cause: avatarUrl.error }
      )
    );
  }

  return result.pass({ url: avatarUrl.value });
};

export { uploadProfileAvatarFile };
export type { ProfileAvatarFileStore, ProfileAvatarUploadResult };
