import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";

/**
 * The largest avatar accepted by the form, upload gateway, and Blob policy.
 */
const MAX_AVATAR_SIZE_IN_BYTES = 5 * 1024 * 1024;

/**
 * The media types accepted for private profile avatars.
 */
const ACCEPTED_PROFILE_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

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
 * The repair category carried from validation or storage to the profile form.
 */
type ProfileAvatarErrorCode =
  | "filename_type_mismatch"
  | "invalid_uploaded_avatar_metadata"
  | "invalid_uploaded_avatar_key"
  | "session_expired"
  | "too_large"
  | "unsupported_type"
  | "upload_forbidden"
  | "upload_missing"
  | "upload_unavailable"
  | "upload_unconfirmed"
  | "wrong_file_count";

/**
 * The stage at which avatar persistence stopped.
 */
type ProfileAvatarErrorPhase =
  | "completion"
  | "presign"
  | "reconciliation"
  | "transfer"
  | "validation";

/**
 * What is known about storage after an avatar failure.
 */
type ProfileAvatarStorageState = "not_uploaded" | "unknown" | "uploaded";

/**
 * Safe diagnostic facts attached to a profile-avatar failure.
 */
interface ProfileAvatarErrorDetails {
  acceptedTypes?: readonly string[];
  actualBytes?: number;
  actualName?: string;
  actualType?: string;
  expectedExtension?: string;
  maxBytes?: number;
}

/**
 * Structured avatar failure shared by the browser, form, and gateway.
 */
class ProfileAvatarError extends Error {
  readonly code: ProfileAvatarErrorCode;
  readonly details?: ProfileAvatarErrorDetails;
  readonly pendingKey?: string;
  readonly phase: ProfileAvatarErrorPhase;
  readonly retryable: boolean;
  readonly storageState: ProfileAvatarStorageState;

  /**
   * Creates one safe, repair-oriented avatar failure.
   *
   * @param message - Human-readable summary safe to display to the user.
   * @param options - Machine-readable failure state and optional root cause.
   * @param options.cause - Preserves an operator-facing failure privately.
   * @param options.code - Identifies the repair path.
   * @param options.details - Carries safe validation facts.
   * @param options.pendingKey - Identifies an upload eligible for
   *   reconciliation.
   * @param options.phase - Identifies where persistence stopped.
   * @param options.retryable - Whether a later attempt can make progress.
   * @param options.storageState - Records whether image bytes may exist.
   */
  constructor(
    message: string,
    options: {
      cause?: unknown;
      code: ProfileAvatarErrorCode;
      details?: ProfileAvatarErrorDetails;
      pendingKey?: string;
      phase: ProfileAvatarErrorPhase;
      retryable: boolean;
      storageState: ProfileAvatarStorageState;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = "ProfileAvatarError";
    this.code = options.code;
    this.details = options.details;
    this.pendingKey = options.pendingKey;
    this.phase = options.phase;
    this.retryable = options.retryable;
    this.storageState = options.storageState;
  }
}

/**
 * Browser-reported metadata checked before avatar upload authority is issued.
 */
interface ProfileAvatarFileMetadata {
  name: string;
  size: number;
  type: string;
}

/**
 * Metadata required to confirm a direct upload after its completion call fails.
 */
interface ReconciledProfileAvatar {
  key: string;
  size: number;
  type: string;
}

/**
 * Uploads one avatar directly from the browser to its signed storage target.
 */
type UploadProfileAvatar = (file: File) => Promise<ReconciledProfileAvatar>;

/**
 * Looks up an owner-scoped avatar after an uncertain completion response.
 */
type ReconcileProfileAvatar = (key: string) => Promise<ReconciledProfileAvatar>;

/**
 * Values required to upload one browser-selected profile avatar.
 */
interface UploadProfileAvatarFileOptions {
  file: File;
  reconcile?: ReconcileProfileAvatar;
  upload: UploadProfileAvatar;
}

/**
 * Values required to reconcile a previously transferred profile avatar.
 */
interface ReconcileProfileAvatarFileOptions {
  file: File;
  key: string;
  reconcile: ReconcileProfileAvatar;
}

/**
 * The typed outcome of validating and uploading a selected profile avatar.
 */
type ProfileAvatarUploadResult = Result<{ url: string }, ProfileAvatarError>;

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
 * @returns The canonical extension or structured validation guidance.
 */
const validateProfileAvatarFile = (
  file: ProfileAvatarFileMetadata
): Result<{ extension: ProfileAvatarExtension }, ProfileAvatarError> => {
  const extension = getAvatarFileExtension(file.type);

  if (extension === null) {
    return result.fail(
      new ProfileAvatarError("Choose a JPEG, PNG, or WebP image.", {
        code: "unsupported_type",
        details: {
          acceptedTypes: ACCEPTED_PROFILE_AVATAR_TYPES,
          actualType: file.type,
        },
        phase: "validation",
        retryable: false,
        storageState: "not_uploaded",
      })
    );
  }

  if (
    !Number.isFinite(file.size) ||
    file.size < 0 ||
    file.size > MAX_AVATAR_SIZE_IN_BYTES
  ) {
    return result.fail(
      new ProfileAvatarError("Choose an image up to 5 MiB.", {
        code: "too_large",
        details: {
          actualBytes: file.size,
          maxBytes: MAX_AVATAR_SIZE_IN_BYTES,
        },
        phase: "validation",
        retryable: false,
        storageState: "not_uploaded",
      })
    );
  }

  return result.pass({ extension });
};

/**
 * Validates metadata before the gateway signs a canonical avatar object key.
 *
 * @param file - The untrusted file metadata submitted to the Files SDK.
 * @returns The canonical extension or structured validation guidance.
 */
const validateProfileAvatarUploadMetadata = (
  file: ProfileAvatarFileMetadata
): Result<{ extension: ProfileAvatarExtension }, ProfileAvatarError> => {
  const validated = validateProfileAvatarFile(file);

  if (!validated.ok) {
    return validated;
  }

  if (!file.name.toLowerCase().endsWith(`.${validated.value.extension}`)) {
    return result.fail(
      new ProfileAvatarError(
        "Choose a file whose extension matches its image format.",
        {
          code: "filename_type_mismatch",
          details: {
            actualName: file.name,
            expectedExtension: validated.value.extension,
          },
          phase: "validation",
          retryable: false,
          storageState: "not_uploaded",
        }
      )
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
 * Projects an SDK upload key into the caller-facing avatar namespace.
 *
 * @param key - The key returned by the namespaced upload endpoint.
 * @returns The canonical caller-facing key.
 */
const createProfileAvatarKey = (key: string): string =>
  key.startsWith(`${PROFILE_AVATAR_NAMESPACE}/`)
    ? key
    : `${PROFILE_AVATAR_NAMESPACE}/${key}`;

/**
 * Validates an uploaded key before it becomes durable profile state.
 *
 * @param key - The caller-facing key to validate.
 * @param extension - The extension selected from the browser media type.
 * @returns A stable private URL or a closed validation failure.
 */
const createValidatedProfileAvatarUrl = (
  key: string,
  extension: ProfileAvatarExtension
): ProfileAvatarUploadResult => {
  if (!isProfileAvatarKey(key) || !key.endsWith(`.${extension}`)) {
    return result.fail(
      new ProfileAvatarError("We couldn’t verify the uploaded image.", {
        code: "invalid_uploaded_avatar_key",
        phase: "completion",
        retryable: false,
        storageState: "uploaded",
      })
    );
  }

  return result.pass({ url: createProfileAvatarUrl(key) });
};

/**
 * Confirms that an uncertain direct upload exists with the selected metadata.
 *
 * @param options - The selected file, canonical key, and owner-scoped lookup.
 * @param options.file - Supplies the expected size and media type.
 * @param options.key - Names the possible stored avatar.
 * @param options.reconcile - Reads metadata through the authenticated gateway.
 * @returns A stable private URL or a retryable reconciliation issue.
 */
const reconcileProfileAvatarFile = async (
  options: ReconcileProfileAvatarFileOptions
): Promise<ProfileAvatarUploadResult> => {
  const validated = validateProfileAvatarFile(options.file);

  if (!validated.ok) {
    return validated;
  }

  const validatedUrl = createValidatedProfileAvatarUrl(
    options.key,
    validated.value.extension
  );

  if (!validatedUrl.ok) {
    return validatedUrl;
  }

  const reconciled = await result.trycatch(
    async () => await options.reconcile(options.key)
  );

  if (!reconciled.ok) {
    const avatarError = result.is(reconciled.error, ProfileAvatarError);

    return result.fail(
      avatarError ??
        new ProfileAvatarError("We couldn’t confirm the upload.", {
          cause: reconciled.error,
          code: "upload_unconfirmed",
          pendingKey: options.key,
          phase: "reconciliation",
          retryable: true,
          storageState: "unknown",
        })
    );
  }

  if (reconciled.value.key !== options.key) {
    return result.fail(
      new ProfileAvatarError("We couldn’t verify the uploaded image.", {
        code: "invalid_uploaded_avatar_key",
        phase: "reconciliation",
        retryable: false,
        storageState: "uploaded",
      })
    );
  }

  if (
    reconciled.value.size !== options.file.size ||
    reconciled.value.type !== options.file.type
  ) {
    return result.fail(
      new ProfileAvatarError("We couldn’t verify the uploaded image.", {
        code: "invalid_uploaded_avatar_metadata",
        phase: "reconciliation",
        retryable: false,
        storageState: "uploaded",
      })
    );
  }

  return validatedUrl;
};

/**
 * Verifies provider metadata before an uploaded avatar becomes durable state.
 *
 * @param file - The selected image whose metadata was authorized.
 * @param uploaded - The stored file returned by upload completion.
 * @param extension - The canonical extension derived from the selected image.
 * @returns The private avatar URL or a closed metadata mismatch.
 */
const createUploadedProfileAvatarUrl = (
  file: File,
  uploaded: ReconciledProfileAvatar,
  extension: ProfileAvatarExtension
): ProfileAvatarUploadResult => {
  if (uploaded.size !== file.size || uploaded.type !== file.type) {
    return result.fail(
      new ProfileAvatarError("We couldn’t verify the uploaded image.", {
        code: "invalid_uploaded_avatar_metadata",
        phase: "completion",
        retryable: false,
        storageState: "uploaded",
      })
    );
  }

  return createValidatedProfileAvatarUrl(
    createProfileAvatarKey(uploaded.key),
    extension
  );
};

/**
 * Converts an upload exception into a retained avatar-domain failure.
 *
 * @param error - The Files SDK error or raw upload rejection.
 * @returns A structured avatar failure safe for the profile form.
 */
const getProfileAvatarUploadError = (error: Error): ProfileAvatarError => {
  const domainError = result.is(error, ProfileAvatarError);

  return (
    domainError ??
    new ProfileAvatarError("We couldn’t confirm the upload.", {
      cause: error,
      code: "upload_unconfirmed",
      phase: "transfer",
      retryable: true,
      storageState: "unknown",
    })
  );
};

/**
 * Validates and uploads a selected avatar through a browser-direct capability.
 *
 * @param options - The image and direct Files SDK upload operation.
 * @param options.file - Supplies the browser-selected image.
 * @param options.reconcile - Confirms storage after an uncertain completion.
 * @param options.upload - Sends bytes to the signed target and verifies
 *   completion.
 * @returns The stable private gateway URL or structured repair guidance.
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
    const error = getProfileAvatarUploadError(uploaded.error);

    if (error.pendingKey !== undefined && options.reconcile !== undefined) {
      return await reconcileProfileAvatarFile({
        file: options.file,
        key: error.pendingKey,
        reconcile: options.reconcile,
      });
    }

    return result.fail(error);
  }

  return createUploadedProfileAvatarUrl(
    options.file,
    uploaded.value,
    validated.value.extension
  );
};

export {
  createProfileAvatarKey,
  isProfileAvatarKey,
  MAX_AVATAR_SIZE_IN_BYTES,
  PROFILE_AVATAR_NAMESPACE,
  PROFILE_AVATAR_UPLOAD_ENDPOINT,
  ProfileAvatarError,
  reconcileProfileAvatarFile,
  uploadProfileAvatarFile,
  validateProfileAvatarFile,
  validateProfileAvatarUploadMetadata,
};
export type { ProfileAvatarFileMetadata, ProfileAvatarUploadResult };
