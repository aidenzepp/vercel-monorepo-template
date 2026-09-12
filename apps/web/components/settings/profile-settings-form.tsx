"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
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
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import type { FieldError as HookFormFieldError } from "react-hook-form";
import { z } from "zod";

import { useSession } from "@/components/auth/session-provider";
import type { Session } from "@/components/auth/session-provider";
import { authClient } from "@/lib/auth/auth-client";

/**
 * Accepts an unset username while preserving the shared Better Auth contract
 * for every non-empty value.
 */
const profileSettingsSchema = z.object({
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
type ProfileSettingsUser = Pick<Session["user"], "name" | "username">;

/**
 * A repairable profile-update failure owned by the settings form.
 */
interface ProfileSettingsIssue {
  field: "root" | "username";
  message: string;
}

interface ProfileFormRowProps {
  children: ReactNode;
  controlId: string;
  description: string;
  error?: HookFormFieldError;
  label: string;
}

interface ProfileUsernameInputProps {
  disabled: boolean;
  placeholder?: string;
}

interface ProfileSettingsFormProps {
  canEditUsername: boolean;
  onSave: (settings: ProfileSettings) => Promise<ProfileSettingsIssue | null>;
  user: ProfileSettingsUser;
}

/**
 * Validated profile values and account policy required by the save operation.
 */
interface SaveProfileOptions {
  canEditUsername: boolean;
  settings: ProfileSettings;
  userId: string;
}

/**
 * Creates the Better Auth update allowed for the current account type.
 *
 * Empty and anonymous usernames are omitted so profile-name changes do not
 * accidentally claim or clear an identifier.
 *
 * @param settings - The validated values submitted by the profile form.
 * @param canEditUsername - Whether the current account may change its username.
 * @returns The fields permitted in the Better Auth update request.
 */
const createProfileUpdate = (
  settings: ProfileSettings,
  canEditUsername: boolean
) => {
  if (!canEditUsername || settings.username.length === 0) {
    return { name: settings.name };
  }

  return { name: settings.name, username: settings.username };
};

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
 * @param options.canEditUsername - Whether the current account may change its
 *   username.
 * @param options.settings - The validated values submitted by the profile form.
 * @param options.userId - Identifies the affected user in operational logs.
 * @returns A repairable issue when persistence fails, or `null` after success.
 */
const saveProfile = async ({
  canEditUsername,
  settings,
  userId,
}: SaveProfileOptions): Promise<ProfileSettingsIssue | null> => {
  const update = createProfileUpdate(settings, canEditUsername);
  const response = await result.trycatch(
    async () => await authClient.updateUser(update)
  );

  if (!response.ok) {
    logger.error(
      {
        err: response.error,
        operation: "profile.update.request",
        userId,
      },
      "Profile update request failed before Better Auth responded"
    );
    return {
      field: "root",
      message:
        "We couldn’t save your changes. Your edits are still here. Try again.",
    };
  }

  if (response.value.error !== null) {
    logger.warn(
      {
        code: response.value.error.code,
        operation: "profile.update.response",
        status: response.value.error.status,
        userId,
      },
      "Better Auth rejected the profile update"
    );
    return getProfileUpdateIssue(response.value.error);
  }

  toast.add({
    description: "Your changes are now reflected throughout templ8.",
    title: "Profile updated",
    type: "success",
  });

  return null;
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
    reset,
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();

  return (
    <Button
      color="neutral"
      disabled={!isDirty || isSubmitting}
      onClick={() => {
        reset();
      }}
      type="button"
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
    <Button disabled={!isDirty} loading={isSubmitting} type="submit">
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
 * @param props.canEditUsername - Whether the username control accepts changes.
 * @param props.onSave - Persists validated values and returns any repairable
 *   failure.
 * @param props.user - Supplies the latest session-backed profile values.
 * @returns The form used to edit a user's public identity.
 * @see https://react-hook-form.com/docs/useform#values
 */
const ProfileSettingsForm = ({
  canEditUsername,
  onSave,
  user,
}: ProfileSettingsFormProps) => {
  const form = useForm<ProfileSettingsFields, unknown, ProfileSettings>({
    resetOptions: { keepDirtyValues: true },
    resolver: zodResolver(profileSettingsSchema),
    values: {
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
    const issue = await onSave(settings);

    if (issue !== null) {
      form.setError(issue.field, { message: issue.message });
      return;
    }

    form.reset(settings);
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
          onSubmit={(event) => {
            void form.handleSubmit(submitProfile)(event);
          }}
        >
          <CardContent>
            <FieldSet disabled={form.formState.isSubmitting}>
              <FieldLegend className="sr-only">Profile</FieldLegend>
              <ProfileSaveError />

              <FieldGroup className="gap-4">
                <ProfileNameInput placeholder="Your name" />
                <ProfileUsernameInput
                  disabled={!canEditUsername}
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
 * @returns The profile form with account-scoped values and persistence.
 */
const ProfileSettingsFormBoundary = () => {
  const { user } = useSession();
  const canEditUsername = user.isAnonymous !== true;

  return (
    <ProfileSettingsForm
      canEditUsername={canEditUsername}
      onSave={async (settings) =>
        await saveProfile({ canEditUsername, settings, userId: user.id })
      }
      user={{ name: user.name, username: user.username }}
    />
  );
};

export {
  createProfileUpdate,
  ProfileNameInput,
  ProfileSettingsForm,
  ProfileSettingsFormBoundary,
  ProfileUsernameInput,
};
