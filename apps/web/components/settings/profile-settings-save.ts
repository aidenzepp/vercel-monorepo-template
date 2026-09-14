import { toast } from "@workspace/ui/components/toast";
import { logger } from "@workspace/utils/logger";
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
  userId: string;
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
  settings.avatar.kind !== "uploaded" ||
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
        "Your session expired. Sign in again to save. Your edits are still here.",
    };
  }

  if (error.status === 429) {
    return {
      field: "root",
      message:
        "You’ve made several changes in a short time. Wait a moment, then try again.",
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
          "Your session expired. Sign in again to finish saving. Your other changes were saved, and the selected image is still here.",
      };
    }
    case "upload_unavailable": {
      return {
        field: "avatar",
        message:
          "Image uploads are temporarily unavailable. Your other changes were saved, and the image remains selected. Try again later.",
      };
    }
    case "invalid_uploaded_avatar_key": {
      return {
        field: "avatar",
        message:
          "The image uploaded, but we couldn’t finish updating your profile. Your other changes were saved, and the image remains selected. Contact support if this continues.",
      };
    }
    case "upload_unconfirmed": {
      return {
        field: "avatar",
        message:
          error.pendingKey === undefined
            ? "We couldn’t confirm whether the image reached storage. Your other changes were saved, and the image remains selected. Check your connection, then save again."
            : "We couldn’t confirm whether the image finished uploading. Your other changes were saved, and the image remains selected. Save again to check the existing upload.",
      };
    }
    default: {
      return {
        field: "avatar",
        message:
          "We couldn’t save that image. Your other changes were saved, and the image remains selected.",
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
  options: Pick<SaveProfileOptions, "settings" | "updateUser" | "userId">
): Promise<Result<null, ProfileSettingsSaveError>> => {
  const response = await result.trycatch(
    async () => await options.updateUser(createProfileUpdate(options.settings))
  );

  if (!response.ok) {
    logger.error(
      {
        err: response.error,
        operation: "profile.identity.request",
        userId: options.userId,
      },
      "Profile identity request failed before Better Auth responded"
    );
    return result.fail(
      new ProfileSettingsSaveError(
        "root",
        "We couldn’t save your changes. Your edits are still here. Try again.",
        { cause: response.error }
      )
    );
  }

  if (response.value.error !== null) {
    logger.warn(
      {
        code: response.value.error.code,
        operation: "profile.identity.response",
        status: response.value.error.status,
        userId: options.userId,
      },
      "Better Auth rejected the profile identity update"
    );
    const issue = getProfileUpdateIssue(response.value.error);
    return result.fail(
      new ProfileSettingsSaveError(issue.field, issue.message)
    );
  }

  return result.pass(null);
};

/**
 * Records one structured avatar failure for operators without exposing it to
 * UI.
 *
 * @param error - The structured validation or storage failure.
 * @param userId - The account whose avatar operation failed.
 */
const logProfileAvatarError = (
  error: ProfileAvatarError,
  userId: string
): void => {
  logger.error(
    {
      code: error.code,
      err: error.cause,
      operation: `profile.avatar.${error.phase}`,
      pendingKey: error.pendingKey,
      retryable: error.retryable,
      storageState: error.storageState,
      userId,
    },
    "Profile avatar persistence failed"
  );
};

/**
 * Preserves the selected file while recording any upload eligible for lookup.
 *
 * @param avatar - The current selected or pending avatar state.
 * @param error - The storage failure that may include a canonical pending key.
 * @returns The avatar state to retain for the next save.
 */
const createAvatarRepairState = (
  avatar: Exclude<ProfileAvatarState, { kind: "persisted" | "uploaded" }>,
  error: ProfileAvatarError
): ProfileAvatarState =>
  error.pendingKey === undefined
    ? avatar
    : {
        file: avatar.file,
        key: error.pendingKey,
        kind: "pending",
        previewUrl: avatar.previewUrl,
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
        new ProfileAvatarError(
          "We couldn’t confirm whether the image finished uploading.",
          {
            code: "upload_unconfirmed",
            pendingKey: avatar.key,
            phase: "reconciliation",
            retryable: true,
            storageState: "unknown",
          }
        )
      )
    : await options.reconcileAvatar(avatar.file, avatar.key);
};

/**
 * Uploads, reconciles, or reuses an avatar without repeating completed storage.
 *
 * @param options - Avatar state and persistence capabilities for this save.
 * @returns The avatar URL and attachment state, or structured repair guidance.
 */
const resolveProfileAvatar = async (
  options: Pick<
    SaveProfileOptions,
    "reconcileAvatar" | "settings" | "uploadAvatar" | "userId"
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
    logger.error(
      {
        err: persisted.error,
        operation: "profile.avatar.client",
        userId: options.userId,
      },
      "Profile avatar client failed before returning a result"
    );
    return result.fail(
      new ProfileSettingsSaveError(
        "avatar",
        "We couldn’t confirm whether the image reached storage. Your other changes were saved, and the image remains selected. Check your connection, then save again.",
        { avatarState: avatar, cause: persisted.error }
      )
    );
  }

  if (!persisted.value.ok) {
    logProfileAvatarError(persisted.value.error, options.userId);
    const issue = getProfileAvatarSaveIssue(persisted.value.error);
    return result.fail(
      new ProfileSettingsSaveError(issue.field, issue.message, {
        avatarState: createAvatarRepairState(avatar, persisted.value.error),
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
  userId: string;
}): Promise<Result<null, ProfileSettingsSaveError>> => {
  const response = await result.trycatch(
    async () => await options.updateUser({ image: options.url })
  );
  const message =
    "The image uploaded, but we couldn’t attach it to your profile. Your other changes were saved, and we’ll reuse this upload when you save again.";

  if (!response.ok) {
    logger.error(
      {
        err: response.error,
        operation: "profile.avatar.attach.request",
        userId: options.userId,
      },
      "Profile avatar attachment failed before Better Auth responded"
    );
    return result.fail(
      new ProfileSettingsSaveError("avatar", message, {
        avatarState: options.avatarState,
        cause: response.error,
      })
    );
  }

  if (response.value.error !== null) {
    logger.warn(
      {
        code: response.value.error.code,
        operation: "profile.avatar.attach.response",
        status: response.value.error.status,
        userId: options.userId,
      },
      "Better Auth rejected the profile avatar attachment"
    );
    let issue: ProfileSettingsIssue = {
      field: "avatar",
      message,
    };

    if (response.value.error.status === 401) {
      issue = {
        field: "root",
        message:
          "Your session expired. Sign in again to finish saving. The image is uploaded and remains selected.",
      };
    } else if (response.value.error.status === 429) {
      issue = {
        field: "root",
        message:
          "The image uploaded, but you’ve made several changes in a short time. Your other changes were saved, and we’ll reuse this upload. Wait a moment, then save again.",
      };
    }

    return result.fail(
      new ProfileSettingsSaveError(issue.field, issue.message, {
        avatarState: options.avatarState,
      })
    );
  }

  return result.pass(null);
};

/**
 * Notifies the user after every requested profile field is durable.
 */
const showProfileSavedToast = (): void => {
  toast.add({
    description: "Your changes are now reflected throughout templ8.",
    title: "Profile updated",
    type: "success",
  });
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
      userId: options.userId,
    });

    if (!attached.ok) {
      return result.fail(attached.error);
    }
  }

  showProfileSavedToast();
  return result.pass({ avatar: avatar.value.url });
};

export { createProfileUpdate, ProfileSettingsSaveError, saveProfile };
export type { ProfileSettingsSaveResult };
