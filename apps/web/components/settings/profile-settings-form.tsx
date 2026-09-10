"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { upload } from "@vercel/blob/client";
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
import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { SubmitEvent } from "react";
import { useForm } from "react-hook-form";

import { useSession } from "@/components/auth/session-provider";
import { ProfileAvatarField } from "@/components/settings/profile-avatar-field";
import { authClient } from "@/lib/auth/auth-client";
import { createAvatarPathname } from "@/lib/profile/avatar";
import { profileSettingsSchema } from "@/lib/settings/profile-settings-schema";
import type {
  ProfileSettings,
  ProfileSettingsFields,
} from "@/lib/settings/profile-settings-schema";

interface ProfileSettingsIssue {
  field: "root" | "username";
  message: string;
}

type ProfileSettingsUpdate =
  | { image: string }
  | { name: string; username: string };

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

const ProfileSettingsForm = () => {
  const router = useRouter();
  const { user } = useSession();
  const avatarInput = useRef<HTMLInputElement | null>(null);
  const uploadedAvatarUrls = useRef(new WeakMap<File, string>());
  const profile = {
    avatar: undefined,
    name: user.name,
    username: user.username ?? "",
  };
  const form = useForm<ProfileSettingsFields, unknown, ProfileSettings>({
    defaultValues: profile,
    resetOptions: { keepDirtyValues: true, keepErrors: true },
    resolver: zodResolver(profileSettingsSchema),
    values: profile,
  });
  const { dirtyFields, errors, isDirty, isSubmitting } = form.formState;
  // A changed query gives the browser a fresh read after Better Auth saves a new image.
  const avatarUrl =
    user.image === null || user.image === undefined
      ? null
      : `/api/avatar?version=${encodeURIComponent(user.image)}`;

  const updateProfile = async (
    update: ProfileSettingsUpdate
  ): Promise<boolean> => {
    const response = await result.trycatch(
      async () => await authClient.updateUser(update)
    );

    if (!response.ok) {
      form.setError("root", {
        message:
          "The profile service could not be reached. Your edits are still here. Try again.",
      });
      return false;
    }

    if (response.value.error === null) {
      return true;
    }

    if (response.value.error.status === 401) {
      router.replace("/sign-in");
      router.refresh();
      return false;
    }

    const issue = getProfileUpdateIssue(response.value.error);
    form.setError(issue.field, { message: issue.message });

    return false;
  };

  /**
   * Saves identity before uploading media, so a rejected name or username
   * cannot leave a new Blob behind. Completed uploads are reused on retry.
   */
  const saveProfile = async (settings: ProfileSettings) => {
    const identityChanged =
      dirtyFields.name === true || dirtyFields.username === true;

    if (identityChanged) {
      const identitySaved = await updateProfile({
        name: settings.name,
        username: settings.username,
      });

      if (!identitySaved) {
        return;
      }

      form.resetField("name", { defaultValue: settings.name });
      form.resetField("username", { defaultValue: settings.username });
    }

    if (dirtyFields.avatar === true && settings.avatar !== undefined) {
      const { contentType, file } = settings.avatar;
      let image = uploadedAvatarUrls.current.get(file);

      if (image === undefined) {
        const uploaded = await result.trycatch(
          async () =>
            await upload(createAvatarPathname(user.id, contentType), file, {
              access: "private",
              contentType,
              handleUploadUrl: "/api/uploads/avatar",
            })
        );

        if (!uploaded.ok) {
          const session = await result.trycatch(
            async () => await authClient.getSession()
          );

          const sessionExpired =
            session.ok &&
            session.value.data === null &&
            (session.value.error === null ||
              session.value.error?.status === 401);

          if (sessionExpired) {
            router.replace("/sign-in");
            router.refresh();
            return;
          }

          form.setError("avatar", {
            message:
              "The avatar upload was interrupted. Your selection is still here. Try again.",
          });
          return;
        }

        image = uploaded.value.url;
        uploadedAvatarUrls.current.set(file, image);
      }

      if (!(await updateProfile({ image }))) {
        return;
      }

      form.resetField("avatar");
      if (avatarInput.current !== null) {
        avatarInput.current.value = "";
      }
    }

    router.refresh();
    toast.add({
      description: "Your changes are now reflected throughout templ8.",
      title: "Profile updated",
      type: "success",
    });
  };

  const resetProfile = () => {
    form.reset();
    if (avatarInput.current !== null) {
      avatarInput.current.value = "";
    }
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

      <form noValidate onSubmit={submitProfile}>
        <CardContent>
          <FieldSet disabled={isSubmitting}>
            <FieldLegend className="sr-only">Profile</FieldLegend>
            <FieldError errors={[errors.root]} />

            <ProfileAvatarField
              captureInput={(element) => {
                avatarInput.current = element;
              }}
              control={form.control}
              image={avatarUrl}
              isAnonymous={user.isAnonymous === true}
            />

            <FieldGroup className="gap-4">
              <Field data-invalid={errors.name !== undefined}>
                <FieldLabel htmlFor="settings-name">Name</FieldLabel>
                <Input
                  {...form.register("name")}
                  aria-describedby="settings-name-description"
                  aria-errormessage={
                    errors.name === undefined
                      ? undefined
                      : "settings-name-error"
                  }
                  aria-invalid={errors.name !== undefined}
                  autoComplete="name"
                  id="settings-name"
                />
                <FieldDescription id="settings-name-description">
                  This is the name shown throughout the application.
                </FieldDescription>
                <FieldError errors={[errors.name]} id="settings-name-error" />
              </Field>

              <Field data-invalid={errors.username !== undefined}>
                <FieldLabel htmlFor="settings-username">Username</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>@</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    {...form.register("username")}
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
                    placeholder="username"
                    spellCheck={false}
                  />
                </InputGroup>
                <FieldDescription id="settings-username-description">
                  Use letters, numbers, underscores, and single periods between
                  characters.
                </FieldDescription>
                <FieldError
                  errors={[errors.username]}
                  id="settings-username-error"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>

        <CardFooter className="mt-6 justify-end gap-2">
          <Button
            color="neutral"
            disabled={!isDirty || isSubmitting}
            onClick={resetProfile}
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
    </Card>
  );
};

export { ProfileSettingsForm };
