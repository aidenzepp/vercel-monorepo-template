"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@workspace/ui/components/input-group";
import { toast } from "@workspace/ui/components/toast";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";

import { useSession } from "@/components/auth/session-provider";
import type { Session } from "@/components/auth/session-provider";
import { authClient } from "@/lib/auth/auth-client";
import type { ProfileAvatarUploadResult } from "@/lib/files/profile-avatar";

/**
 * Accepts an unset username while preserving the shared Better Auth contract
 * for every non-empty value.
 */
const profileSettingsSchema = z.object({
  avatar: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("persisted"), url: z.string().nullable() }),
    z.object({
      file: z.custom<File>(),
      kind: z.literal("selected"),
      previewUrl: z.string(),
    }),
  ]),
  name: nameSchema,
  username: z
    .union([usernameSchema, z.literal("")])
    .optional()
    .transform((username) => username ?? ""),
});

/**
 * The raw values React Hook Form may collect from profile controls.
 */
type ProfileSettingsFields = z.input<typeof profileSettingsSchema>;

/**
 * A validated profile submission with a normalized username representation.
 */
type ProfileSettings = z.output<typeof profileSettingsSchema>;

/**
 * The session fields required to initialize profile settings.
 */
type ProfileSettingsUser = Pick<Session["user"], "image" | "name" | "username">;

/**
 * A repairable profile-update failure owned by the settings form.
 */
interface ProfileSettingsIssue {
  field: "avatar" | "root" | "username";
  message: string;
}

/**
 * Better Auth user fields changed by the profile save operation.
 */
interface ProfileUserUpdate {
  image?: string;
  name?: string;
  username?: string;
}

/**
 * The repair or persisted avatar state returned by a profile save.
 */
type ProfileSettingsSaveResult =
  | { issue: ProfileSettingsIssue }
  | { avatar: string | null; issue: null };

interface ProfileFormRowProps {
  children: ReactNode;
  controlId: string;
  description: string;
  error?: { message?: string };
  label: string;
}

interface ProfileUsernameInputProps {
  disabled: boolean;
  placeholder?: string;
}

interface ProfileSettingsFormProps {
  canEditProfile: boolean;
  onSave: (settings: ProfileSettings) => Promise<ProfileSettingsSaveResult>;
  user: ProfileSettingsUser;
}

interface ProfileSettingsFormBoundaryProps {
  onUploadAvatar: (formData: FormData) => Promise<ProfileAvatarUploadResult>;
}

/**
 * Validated profile values and account policy required by the save operation.
 */
interface SaveProfileOptions {
  canEditProfile: boolean;
  settings: ProfileSettings;
  updateUser: (
    update: ProfileUserUpdate
  ) => Promise<{ error: { code?: string; status?: number } | null }>;
  uploadAvatar: (formData: FormData) => Promise<ProfileAvatarUploadResult>;
  userId: string;
}

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
        message: "That username is too long.",
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
 * Persists a profile update and translates Better Auth failures for the form.
 *
 * @param options - The account capability, submitted values, and logging
 *   identity.
 * @param options.canEditProfile - Whether the current account may change any
 *   profile fields.
 * @param options.settings - The validated values submitted by the profile form.
 * @param options.updateUser - Persists the Better Auth user fields.
 * @param options.uploadAvatar - Stores a newly selected avatar when present.
 * @param options.userId - Identifies the affected user in operational logs.
 * @returns A repairable issue or the avatar state saved with the profile.
 */
const saveProfile = async ({
  canEditProfile,
  settings,
  updateUser,
  uploadAvatar,
  userId,
}: SaveProfileOptions): Promise<ProfileSettingsSaveResult> => {
  if (!canEditProfile) {
    return {
      issue: {
        field: "root",
        message: "Temporary accounts cannot change profile settings.",
      },
    };
  }

  let avatar =
    settings.avatar.kind === "persisted" ? settings.avatar.url : null;
  const identityUpdate = createProfileUpdate(settings);
  const identityResponse = await result.trycatch(
    async () => await updateUser(identityUpdate)
  );

  if (!identityResponse.ok) {
    logger.error(
      {
        err: identityResponse.error,
        operation: "profile.identity.request",
        userId,
      },
      "Profile identity request failed before Better Auth responded"
    );
    return {
      issue: {
        field: "root",
        message:
          "We couldn’t save your changes. Your edits are still here. Try again.",
      },
    };
  }

  if (identityResponse.value.error !== null) {
    logger.warn(
      {
        code: identityResponse.value.error.code,
        operation: "profile.identity.response",
        status: identityResponse.value.error.status,
        userId,
      },
      "Better Auth rejected the profile identity update"
    );
    return { issue: getProfileUpdateIssue(identityResponse.value.error) };
  }

  if (settings.avatar.kind === "selected") {
    const formData = new FormData();
    formData.set("avatar", settings.avatar.file);
    const uploaded = await result.trycatch(
      async () => await uploadAvatar(formData)
    );

    if (!uploaded.ok) {
      logger.error(
        {
          err: uploaded.error,
          operation: "profile.avatar.request",
          userId,
        },
        "Profile avatar request failed before the upload action responded"
      );
      return {
        issue: {
          field: "avatar",
          message:
            "The upload request didn’t reach storage. Your other profile changes were saved, and the selected image is still here. Check your connection, then save again.",
        },
      };
    }

    if (!uploaded.value.ok) {
      return {
        issue: { field: "avatar", message: uploaded.value.error.message },
      };
    }

    avatar = uploaded.value.value.url;
    const avatarResponse = await result.trycatch(
      async () => await updateUser({ image: avatar ?? undefined })
    );

    if (!avatarResponse.ok) {
      logger.error(
        {
          err: avatarResponse.error,
          operation: "profile.avatar.update.request",
          userId,
        },
        "Profile avatar update failed before Better Auth responded"
      );
      return {
        issue: {
          field: "avatar",
          message:
            "The image reached storage, but we couldn’t attach it to your profile. Your other profile changes were saved, and the selected image is still here. Save again to retry.",
        },
      };
    }

    if (avatarResponse.value.error !== null) {
      logger.warn(
        {
          code: avatarResponse.value.error.code,
          operation: "profile.avatar.update.response",
          status: avatarResponse.value.error.status,
          userId,
        },
        "Better Auth rejected the profile avatar update"
      );
      return {
        issue: {
          field: "avatar",
          message:
            "The image reached storage, but we couldn’t attach it to your profile. Your other profile changes were saved, and the selected image is still here. Save again to retry.",
        },
      };
    }
  }

  toast.add({
    description: "Your changes are now reflected throughout templ8.",
    title: "Profile updated",
    type: "success",
  });

  return { avatar, issue: null };
};

/**
 * Displays the shared accessible structure surrounding a profile control.
 *
 * @param props - The control, identifiers, copy, and validation state.
 * @param props.children - Supplies the semantic input control.
 * @param props.controlId - Connects the label, description, and error.
 * @param props.description - Explains how the profile value is used.
 * @param props.error - Supplies the current field validation failure.
 * @param props.label - Names the field for the user.
 * @returns A labeled profile form row.
 */
const ProfileFormRow = ({
  children,
  controlId,
  description,
  error,
  label,
}: ProfileFormRowProps) => (
  <Field data-invalid={error !== undefined}>
    <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
    {children}
    <FieldDescription id={`${controlId}-description`}>
      {description}
    </FieldDescription>
    <FieldError
      errors={error === undefined ? [] : [error]}
      id={`${controlId}-error`}
    />
  </Field>
);

/**
 * Displays the current profile avatar beside its replacement file control.
 *
 * @returns The avatar field registered by the surrounding profile form.
 */
const ProfileAvatarInput = () => {
  const {
    field: { name, onBlur, onChange, ref: inputRef, value: avatar },
    fieldState: { error },
  } = useController<ProfileSettingsFields, "avatar">({ name: "avatar" });
  const controlId = "settings-avatar";
  const avatarUrl =
    avatar.kind === "selected" ? avatar.previewUrl : (avatar.url ?? undefined);
  const previewUrl = avatar.kind === "selected" ? avatar.previewUrl : null;

  useEffect(
    () => () => {
      if (previewUrl !== null) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl]
  );

  return (
    <Field data-invalid={error !== undefined}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:gap-6">
        <div className="flex min-w-0 flex-col gap-3">
          <FieldLabel htmlFor={controlId}>Avatar</FieldLabel>
          <Input
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={`${controlId}-description`}
            aria-errormessage={
              error === undefined ? undefined : `${controlId}-error`
            }
            aria-invalid={error !== undefined}
            id={controlId}
            name={name}
            onBlur={() => {
              onBlur();
            }}
            onChange={(event) => {
              const file = event.currentTarget.files?.item(0);

              if (file !== null && file !== undefined) {
                onChange({
                  file,
                  kind: "selected",
                  previewUrl: URL.createObjectURL(file),
                });
              }
            }}
            ref={inputRef}
            type="file"
          />
          <FieldDescription id={`${controlId}-description`}>
            Choose a JPEG, PNG, or WebP image up to 5 MB.
          </FieldDescription>
          <FieldError
            errors={error === undefined ? [] : [error]}
            id={`${controlId}-error`}
          />
        </div>
        <Avatar className="size-16 sm:size-20">
          {avatarUrl === undefined ? null : (
            <AvatarImage alt="" src={avatarUrl} />
          )}
          <AvatarFallback />
        </Avatar>
      </div>
    </Field>
  );
};

/**
 * Displays the name control registered by the surrounding profile form.
 *
 * @param props - The presentation values for the name field.
 * @param props.placeholder - Supplies the control's empty-state hint.
 * @returns The editable display-name field.
 */
const ProfileNameInput = ({ placeholder }: { placeholder?: string }) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();
  const controlId = "settings-name";

  return (
    <ProfileFormRow
      controlId={controlId}
      description="This is the name shown throughout the application."
      error={errors.name}
      label="Name"
    >
      <Input
        {...register("name")}
        aria-describedby={`${controlId}-description`}
        aria-errormessage={
          errors.name === undefined ? undefined : `${controlId}-error`
        }
        aria-invalid={errors.name !== undefined}
        autoComplete="name"
        id={controlId}
        placeholder={placeholder}
      />
    </ProfileFormRow>
  );
};

/**
 * Displays the username control registered by the surrounding profile form.
 *
 * @param props - The capability and presentation values for the username field.
 * @param props.disabled - Prevents temporary accounts from editing or
 *   submitting a username.
 * @param props.placeholder - Supplies the control's empty-state hint.
 * @returns The username field for the current account capability.
 */
const ProfileUsernameInput = ({
  disabled,
  placeholder,
}: ProfileUsernameInputProps) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();
  const controlId = "settings-username";

  return (
    <ProfileFormRow
      controlId={controlId}
      description={
        disabled
          ? "Temporary accounts cannot claim a username."
          : "A unique slug that identifies you throughout the application."
      }
      error={errors.username}
      label="Username"
    >
      <InputGroup data-disabled={disabled || undefined}>
        <InputGroupAddon>
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          {...register("username")}
          aria-describedby={`${controlId}-description`}
          aria-errormessage={
            errors.username === undefined ? undefined : `${controlId}-error`
          }
          aria-invalid={errors.username !== undefined}
          autoCapitalize="none"
          autoComplete="username"
          disabled={disabled}
          id={controlId}
          placeholder={placeholder}
          spellCheck={false}
        />
      </InputGroup>
    </ProfileFormRow>
  );
};

/**
 * Displays the current form-level profile failure.
 *
 * @returns The repair guidance for a failed save, or no content when clear.
 */
const ProfileSaveError = () => {
  const {
    formState: { errors },
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();

  return errors.root === undefined ? null : (
    <FieldError errors={[errors.root]} />
  );
};

/**
 * Restores the latest session-backed profile values.
 *
 * @returns The reset action for the surrounding profile form.
 */
const ProfileResetAction = () => {
  const {
    formState: { isDirty, isSubmitting },
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();

  return (
    <Button
      color="neutral"
      data-cuelume-toggle="press"
      disabled={!isDirty || isSubmitting}
      type="reset"
      variant="outline"
    >
      Reset
    </Button>
  );
};

/**
 * Displays profile submission progress and prevents unchanged saves.
 *
 * @returns The save action for the surrounding profile form.
 */
const ProfileSaveAction = () => {
  const {
    formState: { isDirty, isSubmitting },
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();

  return (
    <Button
      data-cuelume-toggle="press"
      disabled={!isDirty}
      loading={isSubmitting}
      type="submit"
    >
      {isSubmitting ? "Saving…" : "Save changes"}
    </Button>
  );
};

/**
 * Displays editable public identity fields and submits validated changes.
 *
 * Session changes replace pristine values while preserving edits already in
 * progress.
 *
 * @param props - The account capability, current identity, and save operation.
 * @param props.canEditProfile - Whether the account may change profile fields.
 * @param props.onSave - Persists validated values and returns any repairable
 *   failure.
 * @param props.user - Supplies the latest session-backed profile values.
 * @returns The form used to edit a user's public identity.
 * @see https://react-hook-form.com/docs/useform#values
 */
const ProfileSettingsForm = ({
  canEditProfile,
  onSave,
  user,
}: ProfileSettingsFormProps) => {
  const form = useForm<ProfileSettingsFields, unknown, ProfileSettings>({
    resetOptions: { keepDirtyValues: true },
    resolver: zodResolver(profileSettingsSchema),
    values: {
      avatar: { kind: "persisted", url: user.image ?? null },
      name: user.name,
      username: user.username ?? "",
    },
  });

  /**
   * Applies a repairable persistence result without discarding entered values.
   *
   * @param settings - The profile values accepted by local validation.
   * @returns A promise that resolves after the form reflects the persistence
   *   result.
   */
  const submitProfile = async (settings: ProfileSettings) => {
    const saved = await onSave(settings);

    if (saved.issue !== null) {
      form.setError(saved.issue.field, { message: saved.issue.message });
      return;
    }

    form.reset(
      {
        ...settings,
        avatar: { kind: "persisted", url: saved.avatar },
      },
      { keepDirtyValues: false }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Choose how your account appears throughout templ8.
        </CardDescription>
      </CardHeader>

      <FormProvider {...form}>
        <form
          noValidate
          onReset={(event) => {
            const avatarInput =
              event.currentTarget.elements.namedItem("avatar");

            if (avatarInput instanceof HTMLInputElement) {
              avatarInput.value = "";
            }

            form.reset(form.formState.defaultValues, {
              keepDirtyValues: false,
            });
          }}
          onSubmit={(event) => {
            void form.handleSubmit(submitProfile)(event);
          }}
        >
          <CardContent>
            <FieldSet disabled={!canEditProfile || form.formState.isSubmitting}>
              <FieldLegend className="sr-only">Profile</FieldLegend>
              <ProfileSaveError />

              <FieldGroup className="gap-4">
                <ProfileAvatarInput />
                <ProfileNameInput placeholder="Your name" />
                <ProfileUsernameInput
                  disabled={!canEditProfile}
                  placeholder="username"
                />
              </FieldGroup>
            </FieldSet>
          </CardContent>

          <CardFooter className="mt-6 justify-end gap-2">
            <ProfileResetAction />
            <ProfileSaveAction />
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
};

/**
 * Connects the prop-driven profile form to the current Better Auth session.
 *
 * @param props - The server-side avatar upload available to the client form.
 * @param props.onUploadAvatar - Stores a newly selected avatar for the user.
 * @returns The profile form with account-scoped values and persistence.
 */
const ProfileSettingsFormBoundary = ({
  onUploadAvatar,
}: ProfileSettingsFormBoundaryProps) => {
  const { user } = useSession();
  const canEditProfile = user.isAnonymous !== true;

  return (
    <ProfileSettingsForm
      canEditProfile={canEditProfile}
      onSave={async (settings) =>
        await saveProfile({
          canEditProfile,
          settings,
          updateUser: async (update) => await authClient.updateUser(update),
          uploadAvatar: onUploadAvatar,
          userId: user.id,
        })
      }
      user={{ image: user.image, name: user.name, username: user.username }}
    />
  );
};

export {
  createProfileUpdate,
  ProfileNameInput,
  ProfileSettingsForm,
  ProfileSettingsFormBoundary,
  ProfileUsernameInput,
  saveProfile,
};
