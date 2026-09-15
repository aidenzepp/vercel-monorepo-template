"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  FieldContent,
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
import { useFiles } from "files-sdk/react";
import type { ReactNode, SyntheticEvent } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
} from "react-hook-form";

import { useSession } from "@/components/auth/session-provider";
import { profileSettingsSchema } from "@/components/settings/profile-settings-model";
import type {
  ProfileSettings,
  ProfileSettingsFields,
  ProfileSettingsUser,
  ProfileUserUpdate,
} from "@/components/settings/profile-settings-model";
import { saveProfile } from "@/components/settings/profile-settings-save";
import type { ProfileSettingsSaveResult } from "@/components/settings/profile-settings-save";
import { authClient } from "@/lib/auth/auth-client";
import {
  reconcileProfileAvatarFile,
  uploadProfileAvatarFile,
} from "@/lib/files/profile-avatar";
import type { ProfileAvatarUploadResult } from "@/lib/files/profile-avatar";
import { createProfileAvatarFilesOptions } from "@/lib/files/profile-avatar-client";

/**
 * Presentation and validation state shared by ordinary profile fields.
 */
interface ProfileFormRowProps {
  children: ReactNode;
  controlId: string;
  description: string;
  error?: { message?: string };
  label: string;
}

/**
 * Presentation values accepted by the username control.
 */
interface ProfileUsernameInputProps {
  placeholder?: string;
}

/**
 * Values and persistence callbacks required by the prop-driven profile form.
 */
interface ProfileSettingsFormProps {
  canEditProfile: boolean;
  onReset?: () => void;
  onSave: (settings: ProfileSettings) => Promise<ProfileSettingsSaveResult>;
  user: ProfileSettingsUser;
}

/**
 * Clears the browser-owned filename from the profile avatar control.
 *
 * @param form - The mounted profile form whose file input may hold a selection.
 */
const clearProfileAvatarInput = (form: HTMLFormElement | null): void => {
  const avatarInput = form?.elements.namedItem("avatar");

  if (avatarInput instanceof HTMLInputElement) {
    avatarInput.value = "";
  }
};

/**
 * Persists Better Auth user fields through the browser client.
 *
 * @param update - The validated identity fields to change.
 * @returns Better Auth's success or structured error response.
 */
const updateProfileUser = async (update: ProfileUserUpdate) =>
  await authClient.updateUser(update);

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
 * Displays the current or locally selected profile avatar.
 *
 * @param props - The preview source resolved by the avatar field coordinator.
 * @param props.src - The private gateway or local object URL to display.
 * @returns The avatar preview occupying the field's right column.
 */
const ProfileAvatarPreview = ({ src }: { src?: string }) => (
  <Avatar className="size-16 sm:size-20">
    {src === undefined ? null : <AvatarImage alt="" src={src} />}
    <AvatarFallback />
  </Avatar>
);

/**
 * Coordinates avatar state, file selection, preview lifetime, and field errors.
 *
 * @returns The two-column avatar field registered by the profile form.
 */
const ProfileAvatarField = () => {
  const {
    field: { name, onBlur, onChange, ref: inputRef, value: avatar },
    fieldState: { error },
  } = useController<ProfileSettingsFields, "avatar">({ name: "avatar" });
  const controlId = "settings-avatar";
  const avatarUrl =
    avatar.kind === "persisted" ? (avatar.url ?? undefined) : avatar.previewUrl;
  const previewUrl = avatar.kind === "persisted" ? null : avatar.previewUrl;

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
        <FieldContent className="min-w-0 gap-3">
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
                const savedIdentity =
                  avatar.kind === "persisted"
                    ? undefined
                    : avatar.savedIdentity;
                onChange({
                  file,
                  kind: "selected",
                  previewUrl: URL.createObjectURL(file),
                  savedIdentity,
                });
              }
            }}
            ref={inputRef}
            type="file"
          />
          <FieldDescription id={`${controlId}-description`}>
            Choose a JPEG, PNG, or WebP image up to 5 MiB.
          </FieldDescription>
          <FieldError
            errors={error === undefined ? [] : [error]}
            id={`${controlId}-error`}
          />
        </FieldContent>
        <ProfileAvatarPreview src={avatarUrl} />
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
 * @param props - The presentation values for the username field.
 * @param props.placeholder - Supplies the control's empty-state hint.
 * @returns The username field governed by the parent fieldset.
 */
const ProfileUsernameInput = ({ placeholder }: ProfileUsernameInputProps) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();
  const controlId = "settings-username";

  return (
    <ProfileFormRow
      controlId={controlId}
      description="A unique slug that identifies you throughout the application."
      error={errors.username}
      label="Username"
    >
      <InputGroup>
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
 * @param props.onReset - Clears external state when the form is restored.
 * @param props.onSave - Persists validated values and returns any repairable
 *   failure.
 * @param props.user - Supplies the latest session-backed profile values.
 * @returns The form used to edit a user's public identity.
 * @see https://react-hook-form.com/docs/useform#values
 */
const ProfileSettingsForm = ({
  canEditProfile,
  onReset,
  onSave,
  user,
}: ProfileSettingsFormProps) => {
  const formElement = useRef<HTMLFormElement>(null);
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
   * @returns A promise that resolves after the form reflects the result.
   */
  const submitProfile = async (settings: ProfileSettings): Promise<void> => {
    const saved = await onSave(settings);

    if (!saved.ok) {
      if (saved.error.avatarState !== undefined) {
        form.setValue("avatar", saved.error.avatarState, {
          shouldDirty: true,
        });
      }

      form.setError(saved.error.field, { message: saved.error.message });
      return;
    }

    form.reset(
      {
        ...settings,
        avatar: { kind: "persisted", url: saved.value.avatar },
      },
      { keepDirtyValues: false }
    );
    clearProfileAvatarInput(formElement.current);
  };

  /**
   * Cancels the native reset before restoring session-backed profile values.
   *
   * React Hook Form writes the current values into uncontrolled inputs during
   * this event. The browser reset algorithm runs afterward unless canceled and
   * would replace those values with the inputs' empty markup defaults.
   *
   * @param event - The reset event carrying the form's native controls.
   * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#resetting-a-form
   */
  const resetProfile = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    clearProfileAvatarInput(event.currentTarget);
    form.reset(form.formState.defaultValues, { keepDirtyValues: false });
    onReset?.();
  };

  /**
   * Runs React Hook Form validation before the async save coordinator.
   *
   * @param event - The profile form submission event.
   */
  const submitProfileForm = (event: SyntheticEvent<HTMLFormElement>): void => {
    void form.handleSubmit(submitProfile)(event);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          {canEditProfile
            ? "Choose how your account appears throughout templ8."
            : "Temporary accounts cannot change profile settings."}
        </CardDescription>
      </CardHeader>

      <FormProvider {...form}>
        <form
          noValidate
          onReset={resetProfile}
          onSubmit={submitProfileForm}
          ref={formElement}
        >
          <FieldSet
            className="gap-0"
            disabled={!canEditProfile || form.formState.isSubmitting}
          >
            <FieldLegend className="sr-only">Profile</FieldLegend>
            <CardContent>
              <ProfileSaveError />

              <FieldGroup className="gap-4">
                <ProfileAvatarField />
                <ProfileNameInput placeholder="Your name" />
                <ProfileUsernameInput placeholder="username" />
              </FieldGroup>
            </CardContent>

            <CardFooter className="mt-6 justify-end gap-2">
              <ProfileResetAction />
              <ProfileSaveAction />
            </CardFooter>
          </FieldSet>
        </form>
      </FormProvider>
    </Card>
  );
};

/**
 * Connects the prop-driven profile form to Better Auth and private user files.
 *
 * @returns The profile form with account-scoped values and persistence.
 */
const ProfileSettingsFormBoundary = () => {
  const { user } = useSession();
  const avatarFilesOptions = useMemo(
    () => createProfileAvatarFilesOptions(),
    []
  );
  const avatarFiles = useFiles(avatarFilesOptions);
  const canEditProfile = user.isAnonymous !== true;

  /**
   * Uploads one selected avatar and reconciles uncertain completion in place.
   *
   * @param file - The browser-selected image to persist.
   * @returns The stable private avatar URL or structured repair state.
   */
  const uploadAvatar = async (file: File): Promise<ProfileAvatarUploadResult> =>
    await uploadProfileAvatarFile({
      file,
      reconcile: avatarFiles.head,
      upload: avatarFiles.upload,
    });

  /**
   * Rechecks an earlier direct upload without sending its bytes a second time.
   *
   * @param file - The selected image whose metadata must still match.
   * @param key - The canonical owner-scoped avatar key to inspect.
   * @returns The stable private avatar URL or a retryable lookup failure.
   */
  const reconcileAvatar = async (
    file: File,
    key: string
  ): Promise<ProfileAvatarUploadResult> =>
    await reconcileProfileAvatarFile({
      file,
      key,
      reconcile: avatarFiles.head,
    });

  /**
   * Connects form values to Better Auth and the private avatar file client.
   *
   * @param settings - The locally validated profile values to persist.
   * @returns The saved avatar or repairable form issue.
   */
  const saveSettings = async (
    settings: ProfileSettings
  ): Promise<ProfileSettingsSaveResult> => {
    const saved = await saveProfile({
      canEditProfile,
      reconcileAvatar,
      settings,
      updateUser: updateProfileUser,
      uploadAvatar,
    });

    if (saved.ok) {
      avatarFiles.reset();
      toast.add({
        description: "Your changes are now reflected throughout templ8.",
        title: "Profile updated",
        type: "success",
      });
    }

    return saved;
  };

  return (
    <ProfileSettingsForm
      canEditProfile={canEditProfile}
      onReset={avatarFiles.reset}
      onSave={saveSettings}
      user={{ image: user.image, name: user.name, username: user.username }}
    />
  );
};

export {
  ProfileNameInput,
  ProfileSettingsForm,
  ProfileSettingsFormBoundary,
  ProfileUsernameInput,
};
