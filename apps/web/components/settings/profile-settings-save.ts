import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";

import type {
  ProfileAvatarState,
  ProfileSettings,
  ProfileUserUpdate,
} from "@/components/settings/profile-settings-model";
import {
  ProfileAvatarError,
  validateProfileAvatarFile,
} from "@/lib/files/profile-avatar";
import type { ProfileAvatarUploadResult } from "@/lib/files/profile-avatar";

/**
 * Validated profile values and account policy required by the save operation.
 */
interface SaveProfileOptions {
  canEditProfile: boolean;
  reconcileAvatar?: (
    file: File,
    key: string
  ) => Promise<ProfileAvatarUploadResult>;
  settings: ProfileSettings;
  updateUser: (
    update: ProfileUserUpdate
  ) => Promise<{ error: { code?: string; status?: number } | null }>;
  uploadAvatar: (file: File) => Promise<ProfileAvatarUploadResult>;
}

/**
 * The form location responsible for presenting a profile-save failure.
 */
type ProfileSettingsErrorField = "avatar" | "root" | "username";

/**
 * The presentation location and guidance selected for a failed save stage.
 */
interface ProfileSettingsIssue {
  field: ProfileSettingsErrorField;
  message: string;
}

/**
 * The durable profile state returned after every save stage succeeds.
 */
interface ProfileSettingsSaveValue {
  avatar: string | null;
}

/**
 * A failed save stage with the field and avatar repair state the form needs.
 */
class ProfileSettingsSaveError extends Error {
  readonly avatarState?: ProfileAvatarState;
  readonly field: ProfileSettingsErrorField;

  /**
   * Creates a profile failure without losing a successfully uploaded avatar.
   *
   * @param field - The form field that owns the repair message.
   * @param message - The user-facing explanation and next action.
   * @param options - Optional cause and avatar state retained for retry.
   * @param options.avatarState - Prevents a later retry from uploading twice.
   * @param options.cause - Preserves the operator-facing failure.
   */
  constructor(
    field: ProfileSettingsErrorField,
    message: string,
    options: { avatarState?: ProfileAvatarState; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "ProfileSettingsSaveError";
    this.avatarState = options.avatarState;
    this.field = field;
  }
}

/**
 * The explicit success or repair state returned by a profile save.
 */
type ProfileSettingsSaveResult = Result<
  ProfileSettingsSaveValue,
  ProfileSettingsSaveError
>;

/**
 * A resolved avatar and whether it still needs a Better Auth attachment.
 */
interface ResolvedProfileAvatar {
  attachmentState?: ProfileAvatarState;
  shouldAttach: boolean;
  url: string | null;
}

/**
 * The identity values that can already be durable during an avatar retry.
 */
type ProfileIdentity = Pick<ProfileSettings, "name" | "username">;

/**
 * Selects the normalized identity values persisted independently of an avatar.
 *
 * @param settings - The validated profile submission.
 * @returns The identity snapshot used to avoid replaying completed work.
 */
const createProfileIdentity = (settings: ProfileSettings): ProfileIdentity => ({
  name: settings.name,
  username: settings.username,
});

/**
 * Determines whether the current identity differs from its durable snapshot.
 *
 * @param settings - The validated profile submission and avatar retry state.
 * @returns True when Better Auth still needs a name or username update.
 */
const shouldSaveProfileIdentity = (settings: ProfileSettings): boolean =>
  settings.avatar.kind === "persisted" ||
  settings.avatar.savedIdentity === undefined ||
  settings.avatar.savedIdentity.name !== settings.name ||
  settings.avatar.savedIdentity.username !== settings.username;

/**
 * Creates the Better Auth identity update for an editable profile.
 *
 * Empty usernames are omitted so a name change cannot accidentally clear an
 * existing identifier.
 *
 * @param settings - The validated values submitted by the profile form.
 * @returns The fields included in the Better Auth update request.
 */
const createProfileUpdate = (settings: ProfileSettings): ProfileUserUpdate =>
  settings.username.length === 0
    ? { name: settings.name }
    : { name: settings.name, username: settings.username };

/**
 * Maps a Better Auth failure to the field and repair message the form owns.
 *
 * @param error - The provider response code and status for the rejected update.
 * @returns The field-level or form-level issue shown without discarding edits.
 * @see https://better-auth.com/docs/plugins/username
 */
const getProfileUpdateIssue = (error: {
  code?: string;
  status?: number;
}): ProfileSettingsIssue => {
  switch (error.code ?? "") {
    case "USERNAME_TOO_SHORT": {
      return { field: "username", message: "Enter a username." };
    }
    case "USERNAME_TOO_LONG": {
      return {
        field: "username",
        message: "Username must be 30 characters or fewer.",
      };
    }
    case "INVALID_USERNAME": {
      return {
        field: "username",
        message:
          "Enter letters, numbers, underscores, or single periods between characters.",
      };
    }
    case "USERNAME_IS_ALREADY_TAKEN": {
      return {
        field: "username",
        message: "That username is already taken. Choose another.",
      };
    }
    default: {
      break;
    }
  }

  if (error.status === 401) {
    return {
      field: "root",
      message:
        "Your session expired. Sign in again. Your edits are still here.",
    };
  }

  if (error.status === 429) {
    return {
      field: "root",
      message: "Too many changes. Wait a moment, then save again.",
    };
  }

  return {
    field: "root",
    message:
      "We couldn’t save your changes. Your edits are still here. Try again.",
  };
};

/**
 * Maps a structured avatar failure to contextual profile-save guidance.
 *
 * @param error - The validation or storage state returned by avatar
 *   persistence.
 * @returns The field and message that explain what changed and what to do next.
 */
const getProfileAvatarSaveIssue = (
  error: ProfileAvatarError
): ProfileSettingsIssue => {
  switch (error.code) {
    case "filename_type_mismatch":
    case "too_large":
    case "unsupported_type":
    case "wrong_file_count": {
      return { field: "avatar", message: error.message };
    }
    case "session_expired": {
      return {
        field: "root",
        message:
          "Your session expired. Sign in again. Your other changes were saved, and your image is still selected.",
      };
    }
    case "upload_forbidden": {
      return {
        field: "avatar",
        message:
          "This upload isn’t allowed. Your other changes were saved. Refresh and try again.",
      };
    }
    case "upload_missing": {
      return {
        field: "avatar",
        message:
          "The image didn’t finish uploading. Your other changes were saved. Save again to upload it.",
      };
    }
    case "upload_unavailable": {
      return {
        field: "avatar",
        message:
          "Image uploads are unavailable. Your other changes were saved. Try again later.",
      };
    }
    case "invalid_uploaded_avatar_metadata":
    case "invalid_uploaded_avatar_key": {
      return {
        field: "avatar",
        message:
          "We couldn’t verify the uploaded image. Your other changes were saved. Choose it again.",
      };
    }
    case "upload_unconfirmed": {
      return {
        field: "avatar",
        message:
          error.pendingKey === undefined
            ? "We couldn’t confirm the upload. Your other changes were saved. Check your connection and save again."
            : "We couldn’t confirm the upload. Your other changes were saved. Save again to check it.",
      };
    }
    default: {
      return {
        field: "avatar",
        message: "We couldn’t save the image. Your other changes were saved.",
      };
    }
  }
};

/**
 * Validates a selected avatar before any profile fields are persisted.
 *
 * @param avatar - The current avatar form state.
 * @returns A successful preflight or a field-level validation failure.
 */
const validateProfileAvatarSelection = (
  avatar: ProfileAvatarState
): Result<null, ProfileSettingsSaveError> => {
  if (avatar.kind === "persisted") {
    return result.pass(null);
  }

  const validated = validateProfileAvatarFile(avatar.file);

  return validated.ok
    ? result.pass(null)
    : result.fail(
        new ProfileSettingsSaveError("avatar", validated.error.message, {
          cause: validated.error,
        })
      );
};

/**
 * Persists name and username before requesting storage authority.
 *
 * @param options - The submitted settings, identity client, and logging scope.
 * @returns Success or the translated Better Auth failure.
 */
const saveProfileIdentity = async (
  options: Pick<SaveProfileOptions, "settings" | "updateUser">
): Promise<Result<null, ProfileSettingsSaveError>> => {
  const response = await result.trycatch(
    async () => await options.updateUser(createProfileUpdate(options.settings))
  );

  if (!response.ok) {
    return result.fail(
      new ProfileSettingsSaveError(
        "root",
        "We couldn’t save your changes. Your edits are still here. Try again.",
        { cause: response.error }
      )
    );
  }

  if (response.value.error !== null) {
    const issue = getProfileUpdateIssue(response.value.error);
    return result.fail(
      new ProfileSettingsSaveError(issue.field, issue.message)
    );
  }

  return result.pass(null);
};

/**
 * Preserves the selected file while recording any upload eligible for lookup.
 *
 * @param avatar - The current selected or pending avatar state.
 * @param error - The storage failure that may include a canonical pending key.
 * @param savedIdentity - The identity already persisted before avatar storage.
 * @returns The avatar state to retain for the next save.
 */
const createAvatarRepairState = (
  avatar: Exclude<ProfileAvatarState, { kind: "persisted" | "uploaded" }>,
  error: ProfileAvatarError,
  savedIdentity: ProfileIdentity
): ProfileAvatarState => {
  const selected = {
    file: avatar.file,
    kind: "selected" as const,
    previewUrl: avatar.previewUrl,
    savedIdentity,
  };

  if (error.code === "upload_missing" || error.pendingKey === undefined) {
    return selected;
  }

  return { ...selected, key: error.pendingKey, kind: "pending" };
};

/**
 * Runs the upload or reconciliation operation selected by avatar state.
 *
 * @param avatar - The selected or pending avatar to persist.
 * @param options - The available upload and reconciliation capabilities.
 * @returns The stable private URL or structured avatar failure.
 */
const persistProfileAvatar = async (
  avatar: Exclude<ProfileAvatarState, { kind: "persisted" | "uploaded" }>,
  options: Pick<SaveProfileOptions, "reconcileAvatar" | "uploadAvatar">
): Promise<ProfileAvatarUploadResult> => {
  if (avatar.kind === "selected") {
    return await options.uploadAvatar(avatar.file);
  }

  return options.reconcileAvatar === undefined
    ? result.fail(
        new ProfileAvatarError("We couldn’t confirm the upload.", {
          code: "upload_unconfirmed",
          pendingKey: avatar.key,
          phase: "reconciliation",
          retryable: true,
          storageState: "unknown",
        })
      )
    : await options.reconcileAvatar(avatar.file, avatar.key);
};

/**
 * Normalizes an unexpected avatar persistence exception into retryable state.
 *
 * @param avatar - The selected or pending avatar whose operation threw.
 * @param cause - The unexpected browser, network, or SDK exception.
 * @returns A structured error that preserves any key eligible for lookup.
 */
const createUnexpectedAvatarPersistenceError = (
  avatar: Exclude<ProfileAvatarState, { kind: "persisted" | "uploaded" }>,
  cause: unknown
): ProfileAvatarError =>
  new ProfileAvatarError("We couldn’t confirm the upload.", {
    cause,
    code: "upload_unconfirmed",
    pendingKey: avatar.kind === "pending" ? avatar.key : undefined,
    phase: avatar.kind === "pending" ? "reconciliation" : "transfer",
    retryable: true,
    storageState: "unknown",
  });

/**
 * Uploads, reconciles, or reuses an avatar without repeating completed storage.
 *
 * @param options - Avatar state and persistence capabilities for this save.
 * @returns The avatar URL and attachment state, or structured repair guidance.
 */
const resolveProfileAvatar = async (
  options: Pick<
    SaveProfileOptions,
    "reconcileAvatar" | "settings" | "uploadAvatar"
  >
): Promise<Result<ResolvedProfileAvatar, ProfileSettingsSaveError>> => {
  const { avatar } = options.settings;

  if (avatar.kind === "persisted") {
    return result.pass({ shouldAttach: false, url: avatar.url });
  }

  if (avatar.kind === "uploaded") {
    const attachmentState: ProfileAvatarState = {
      ...avatar,
      savedIdentity: createProfileIdentity(options.settings),
    };
    return result.pass({
      attachmentState,
      shouldAttach: true,
      url: avatar.url,
    });
  }

  const persisted = await result.trycatch(
    async () => await persistProfileAvatar(avatar, options)
  );

  if (!persisted.ok) {
    const error = createUnexpectedAvatarPersistenceError(
      avatar,
      persisted.error
    );
    const issue = getProfileAvatarSaveIssue(error);
    return result.fail(
      new ProfileSettingsSaveError(issue.field, issue.message, {
        avatarState: createAvatarRepairState(
          avatar,
          error,
          createProfileIdentity(options.settings)
        ),
        cause: error,
      })
    );
  }

  if (!persisted.value.ok) {
    const issue = getProfileAvatarSaveIssue(persisted.value.error);
    return result.fail(
      new ProfileSettingsSaveError(issue.field, issue.message, {
        avatarState: createAvatarRepairState(
          avatar,
          persisted.value.error,
          createProfileIdentity(options.settings)
        ),
        cause: persisted.value.error,
      })
    );
  }

  const uploaded: ProfileAvatarState = {
    file: avatar.file,
    kind: "uploaded",
    previewUrl: avatar.previewUrl,
    savedIdentity: createProfileIdentity(options.settings),
    url: persisted.value.value.url,
  };
  return result.pass({
    attachmentState: uploaded,
    shouldAttach: true,
    url: uploaded.url,
  });
};

/**
 * Maps an avatar attachment rejection to its concise repair guidance.
 *
 * @param error - The Better Auth status returned by the image update.
 * @returns The field and message that preserve the uploaded avatar for retry.
 */
const getProfileAvatarAttachmentIssue = (error: {
  status?: number;
}): ProfileSettingsIssue => {
  if (error.status === 401) {
    return {
      field: "root",
      message:
        "Your session expired. Sign in again, then save. We’ll reuse the uploaded image.",
    };
  }

  if (error.status === 429) {
    return {
      field: "root",
      message:
        "Too many changes. Wait a moment, then save again. We’ll reuse the uploaded image.",
    };
  }

  return {
    field: "avatar",
    message:
      "The image uploaded but wasn’t attached. Save again; we’ll reuse it.",
  };
};

/**
 * Attaches one uploaded avatar URL to the Better Auth user.
 *
 * @param options - Identity client, avatar URL, repair state, and logging
 *   scope.
 * @returns Success or an attachment-only retry failure.
 */
const attachProfileAvatar = async (options: {
  avatarState: ProfileAvatarState;
  updateUser: SaveProfileOptions["updateUser"];
  url: string;
}): Promise<Result<null, ProfileSettingsSaveError>> => {
  const response = await result.trycatch(
    async () => await options.updateUser({ image: options.url })
  );
  const fallbackIssue = getProfileAvatarAttachmentIssue({});

  if (!response.ok) {
    return result.fail(
      new ProfileSettingsSaveError(fallbackIssue.field, fallbackIssue.message, {
        avatarState: options.avatarState,
        cause: response.error,
      })
    );
  }

  if (response.value.error !== null) {
    const issue = getProfileAvatarAttachmentIssue(response.value.error);

    return result.fail(
      new ProfileSettingsSaveError(issue.field, issue.message, {
        avatarState: options.avatarState,
      })
    );
  }

  return result.pass(null);
};

/**
 * Persists a profile in authorization, validation, identity, upload, and attach
 * stages.
 *
 * @param options - The account capability and persistence dependencies.
 * @returns A repairable issue or the avatar state saved with the profile.
 */
const saveProfile = async (
  options: SaveProfileOptions
): Promise<ProfileSettingsSaveResult> => {
  if (!options.canEditProfile) {
    return result.fail(
      new ProfileSettingsSaveError(
        "root",
        "Temporary accounts cannot change profile settings."
      )
    );
  }

  const validated = validateProfileAvatarSelection(options.settings.avatar);

  if (!validated.ok) {
    return result.fail(validated.error);
  }

  if (shouldSaveProfileIdentity(options.settings)) {
    const identity = await saveProfileIdentity(options);

    if (!identity.ok) {
      return result.fail(identity.error);
    }
  }

  const avatar = await resolveProfileAvatar(options);

  if (!avatar.ok) {
    return result.fail(avatar.error);
  }

  if (
    avatar.value.shouldAttach &&
    avatar.value.attachmentState !== undefined &&
    avatar.value.url !== null
  ) {
    const attached = await attachProfileAvatar({
      avatarState: avatar.value.attachmentState,
      updateUser: options.updateUser,
      url: avatar.value.url,
    });

    if (!attached.ok) {
      return result.fail(attached.error);
    }
  }

  return result.pass({ avatar: avatar.value.url });
};

export { createProfileUpdate, ProfileSettingsSaveError, saveProfile };
export type { ProfileSettingsSaveResult };
