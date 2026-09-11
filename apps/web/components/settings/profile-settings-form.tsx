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
import { Spinner } from "@workspace/ui/components/spinner";
import { toast } from "@workspace/ui/components/toast";
import { result } from "@workspace/utils/result";
import type { SubmitEvent } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth/auth-client";

const profileSettingsSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
});

type ProfileSettingsFields = z.input<typeof profileSettingsSchema>;
type ProfileSettings = z.output<typeof profileSettingsSchema>;
type ProfileSettingsUser = Pick<
  (typeof authClient.$Infer.Session)["user"],
  "name" | "username"
>;

interface ProfileSettingsIssue {
  field: "root" | "username";
  message: string;
}

/** Maps a Better Auth failure to the field and repair message the form owns. */
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
          "Use letters, numbers, underscores, and single periods between characters.",
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
      message: "Too many updates were attempted. Wait a moment, then retry.",
    };
  }

  return {
    field: "root",
    message: "Your profile could not be updated. Try again.",
  };
};

/** Edits the display name registered by the surrounding profile form. */
const ProfileNameInput = ({ placeholder }: { placeholder?: string }) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();

  return (
    <Field data-invalid={errors.name !== undefined}>
      <FieldLabel htmlFor="settings-name">Name</FieldLabel>
      <Input
        {...register("name")}
        aria-describedby="settings-name-description"
        aria-errormessage={
          errors.name === undefined ? undefined : "settings-name-error"
        }
        aria-invalid={errors.name !== undefined}
        autoComplete="name"
        id="settings-name"
        placeholder={placeholder}
      />
      <FieldDescription id="settings-name-description">
        This is the name shown throughout the application.
      </FieldDescription>
      <FieldError errors={[errors.name]} id="settings-name-error" />
    </Field>
  );
};

/** Edits the username registered by the surrounding profile form. */
const ProfileUsernameInput = ({ placeholder }: { placeholder?: string }) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<ProfileSettingsFields, unknown, ProfileSettings>();

  return (
    <Field data-invalid={errors.username !== undefined}>
      <FieldLabel htmlFor="settings-username">Username</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          {...register("username")}
          aria-describedby="settings-username-description"
          aria-errormessage={
            errors.username === undefined
              ? undefined
              : "settings-username-error"
          }
          aria-invalid={errors.username !== undefined}
          autoCapitalize="none"
          autoComplete="username"
          id="settings-username"
          placeholder={placeholder}
          spellCheck={false}
        />
      </InputGroup>
      <FieldDescription id="settings-username-description">
        Use letters, numbers, underscores, and single periods between
        characters.
      </FieldDescription>
      <FieldError errors={[errors.username]} id="settings-username-error" />
    </Field>
  );
};

/** Owns profile validation, submission, and the form shared by both inputs. */
const ProfileSettingsForm = ({ user }: { user: ProfileSettingsUser }) => {
  const form = useForm<ProfileSettingsFields, unknown, ProfileSettings>({
    defaultValues: {
      name: user.name,
      username: user.username ?? "",
    },
    resolver: zodResolver(profileSettingsSchema),
  });
  const { errors, isDirty, isSubmitting } = form.formState;

  const saveProfile = async (settings: ProfileSettings) => {
    const response = await result.trycatch(
      async () =>
        await authClient.updateUser({
          name: settings.name,
          username: settings.username,
        })
    );

    if (!response.ok) {
      form.setError("root", {
        message:
          "The profile service could not be reached. Your edits are still here. Try again.",
      });
      return;
    }

    if (response.value.error !== null) {
      const issue = getProfileUpdateIssue(response.value.error);
      form.setError(issue.field, { message: issue.message });
      return;
    }

    form.reset(settings);
    toast.add({
      description: "Your changes are now reflected throughout templ8.",
      title: "Profile updated",
      type: "success",
    });
  };

  const submitProfile = (event: SubmitEvent<HTMLFormElement>) => {
    void form.handleSubmit(saveProfile)(event);
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
        <form noValidate onSubmit={submitProfile}>
          <CardContent>
            <FieldSet disabled={isSubmitting}>
              <FieldLegend className="sr-only">Profile</FieldLegend>
              <FieldError errors={[errors.root]} />

              <FieldGroup className="gap-4">
                <ProfileNameInput placeholder="Your name" />
                <ProfileUsernameInput placeholder="username" />
              </FieldGroup>
            </FieldSet>
          </CardContent>

          <CardFooter className="mt-6 justify-end gap-2">
            <Button
              color="neutral"
              disabled={!isDirty || isSubmitting}
              onClick={() => {
                form.reset();
              }}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
            <Button disabled={!isDirty || isSubmitting} type="submit">
              {isSubmitting ? <Spinner aria-hidden="true" /> : null}
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
};

export { ProfileNameInput, ProfileSettingsForm, ProfileUsernameInput };
