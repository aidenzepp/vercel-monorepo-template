import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";

/**
 * The largest avatar accepted by the form, upload gateway, and Blob policy.
 */
const MAX_AVATAR_SIZE_IN_BYTES = 5 * 1024 * 1024;

/**
 * The caller-facing namespace reserved for private profile avatars.
 */
const PROFILE_AVATAR_NAMESPACE = "avatars";

/**
 * The Files SDK endpoint used to project private objects to their owner.
 */
const PROFILE_AVATAR_ENDPOINT = "/api/files";

/**
 * The namespaced Files SDK endpoint used for browser-direct avatar uploads.
 */
const PROFILE_AVATAR_UPLOAD_ENDPOINT = `${PROFILE_AVATAR_ENDPOINT}?namespace=${PROFILE_AVATAR_NAMESPACE}`;

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
 * Browser-reported metadata checked before avatar upload authority is issued.
 */
interface ProfileAvatarFileMetadata {
  name: string;
  size: number;
  type: string;
}

/**
 * Uploads one avatar directly from the browser to its signed storage target.
 *
 * @param file - The validated image with a canonical extension.
 * @returns The unscoped key verified by the Files SDK completion handshake.
 */
type UploadProfileAvatar = (file: File) => Promise<{ key: string }>;

/**
 * Values required to upload one browser-selected profile avatar.
 */
interface UploadProfileAvatarFileOptions {
  file: File;
  upload: UploadProfileAvatar;
}

/**
 * The typed outcome of validating and uploading a selected profile avatar.
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
 * Validates the media type and shared size limit for one avatar candidate.
 *
 * @param file - The untrusted metadata supplied by a browser upload request.
 * @returns The canonical extension or user-facing validation guidance.
 */
const validateProfileAvatarFile = (
  file: ProfileAvatarFileMetadata
): Result<{ extension: ProfileAvatarExtension }> => {
  const extension = getAvatarFileExtension(file.type);

  if (extension === null) {
    return result.fail(new Error("Choose a JPEG, PNG, or WebP image."));
  }

  if (
    !Number.isFinite(file.size) ||
    file.size < 0 ||
    file.size > MAX_AVATAR_SIZE_IN_BYTES
  ) {
    return result.fail(new Error("Choose an image that’s 5 MB or smaller."));
  }

  return result.pass({ extension });
};

/**
 * Validates metadata before the gateway signs a canonical avatar object key.
 *
 * @param file - The untrusted file metadata submitted to the Files SDK.
 * @returns The canonical extension or safe validation guidance.
 */
const validateProfileAvatarUploadMetadata = (
  file: ProfileAvatarFileMetadata
): Result<{ extension: ProfileAvatarExtension }> => {
  const validated = validateProfileAvatarFile(file);

  if (!validated.ok) {
    return validated;
  }

  if (!file.name.toLowerCase().endsWith(`.${validated.value.extension}`)) {
    return result.fail(
      new Error("The image filename does not match its selected format.")
    );
  }

  return validated;
};

/**
 * Gives an accepted image the deterministic extension used by gateway keys.
 *
 * @param file - The browser-selected image whose display name is irrelevant.
 * @param extension - The extension derived from its accepted media type.
 * @returns An equivalent browser file whose name produces a canonical key.
 */
const createProfileAvatarUploadFile = (
  file: File,
  extension: ProfileAvatarExtension
): File =>
  new File([file], `avatar.${extension}`, {
    lastModified: file.lastModified,
    type: file.type,
  });

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
 * Validates and uploads a selected avatar through a browser-direct capability.
 *
 * @param options - The image and direct Files SDK upload operation.
 * @param options.file - Supplies the browser-selected image.
 * @param options.upload - Sends bytes to the signed storage target and verifies
 *   completion.
 * @returns The stable private gateway URL or repair guidance for the image.
 */
const uploadProfileAvatarFile = async (
  options: UploadProfileAvatarFileOptions
): Promise<ProfileAvatarUploadResult> => {
  const validated = validateProfileAvatarFile(options.file);

  if (!validated.ok) {
    return validated;
  }

  const uploadFile = createProfileAvatarUploadFile(
    options.file,
    validated.value.extension
  );
  const uploaded = await result.trycatch(
    async () => await options.upload(uploadFile)
  );

  if (!uploaded.ok) {
    return result.fail(
      new Error(
        "We couldn’t upload that image. Your other profile changes were saved, and the selected image is still here. Check your connection, then save again.",
        { cause: uploaded.error }
      )
    );
  }

  const key = `${PROFILE_AVATAR_NAMESPACE}/${uploaded.value.key}`;

  if (
    !isProfileAvatarKey(key) ||
    !key.endsWith(`.${validated.value.extension}`)
  ) {
    return result.fail(
      new Error(
        "The image reached storage, but its saved location was invalid. The selected image is still here. Save again to retry."
      )
    );
  }

  return result.pass({ url: createProfileAvatarUrl(key) });
};

export {
  isProfileAvatarKey,
  MAX_AVATAR_SIZE_IN_BYTES,
  PROFILE_AVATAR_NAMESPACE,
  PROFILE_AVATAR_UPLOAD_ENDPOINT,
  uploadProfileAvatarFile,
  validateProfileAvatarUploadMetadata,
};
export type {
  ProfileAvatarFileMetadata,
  ProfileAvatarUploadResult,
  UploadProfileAvatar,
};
