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
import type { Result } from "@workspace/utils/result";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { ProfileAvatarField } from "@/components/settings/profile-avatar-field";
import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@/lib/auth/session";
import {
  avatarContentTypeSchema,
  createAvatarPathname,
  parseOwnedPrivateAvatarUrl,
} from "@/lib/profile/avatar";
import { profileSettingsSchema } from "@/lib/settings/profile-settings-schema";
import type {
  ProfileSettings,
  ProfileSettingsFields,
} from "@/lib/settings/profile-settings-schema";

interface ProfileSettingsIssue {
  field: "root" | "username";
  message: string;
}

interface ProfileSettingsUpdate {
  image?: string;
  name: string;
  username: string;
}

interface UploadedAvatar {
  file: File;
  state: "uncommitted" | "update-outcome-unknown";
  url: string;
}

/**
 * Requests deletion through the authenticated, ownership-checking avatar route.
 * Returns true only when the server confirms that the Blob was removed.
 */
const deleteStoredAvatar = async (url: string): Promise<boolean> => {
  const response = await result.trycatch(
    async () =>
      await fetch("/api/avatar", {
        body: JSON.stringify({ url }),
        headers: { "content-type": "application/json" },
        keepalive: true,
        method: "DELETE",
      })
  );

  return response.ok && response.value.ok;
};

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

/**
 * Coordinates one profile update across React Hook Form, Better Auth, and Blob.
 *
 * A completed upload remains available while a rejected profile update is
 * repaired and retried. An upload with an unknown update outcome is never
 * deleted automatically, and the previous committed avatar is removed only
 * after Better Auth accepts its replacement.
 */
const useProfileSettingsForm = () => {
  const router = useRouter();
  const { user } = useSession();
  const avatarInput = useRef<HTMLInputElement | null>(null);
  const avatarPreviewUrl = useRef<string | null>(null);
  const uploadedAvatar = useRef<UploadedAvatar | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
  // The version changes the browser URL when Better Auth publishes a new image.
  const savedImage =
    user.image === null || user.image === undefined
      ? null
      : `/api/avatar?version=${encodeURIComponent(user.image)}`;
  const displayedImage = previewUrl ?? savedImage;

  useEffect(
    () => () => {
      if (avatarPreviewUrl.current !== null) {
        URL.revokeObjectURL(avatarPreviewUrl.current);
      }
    },
    []
  );

  const setAvatarPreview = (file: File | undefined) => {
    if (avatarPreviewUrl.current !== null) {
      URL.revokeObjectURL(avatarPreviewUrl.current);
    }

    const nextUrl = file === undefined ? null : URL.createObjectURL(file);
    avatarPreviewUrl.current = nextUrl;
    setPreviewUrl(nextUrl);
  };

  const resetProfile = () => {
    const storedAvatar = uploadedAvatar.current;

    if (storedAvatar !== null && storedAvatar.state === "uncommitted") {
      void deleteStoredAvatar(storedAvatar.url);
      uploadedAvatar.current = null;
    }

    form.reset();
    setAvatarPreview(undefined);
    if (avatarInput.current !== null) {
      avatarInput.current.value = "";
    }
  };

  /** Resolves one selected file to a private Blob that is safe to persist. */
  const resolveAvatar = async (
    avatar: File | undefined
  ): Promise<Result<string | null>> => {
    if (avatar === undefined) {
      return result.pass(null);
    }

    const completedUpload = uploadedAvatar.current;

    if (completedUpload?.file === avatar) {
      return result.pass(completedUpload.url);
    }

    if (completedUpload?.state === "update-outcome-unknown") {
      form.setError("avatar", {
        message:
          "Refresh the page before choosing another avatar so the previous update can be confirmed.",
      });

      return result.fail(
        new Error("The previous profile update has an unknown outcome.")
      );
    }

    if (
      completedUpload !== null &&
      !(await deleteStoredAvatar(completedUpload.url))
    ) {
      form.setError("avatar", {
        message: "The previous avatar upload could not be removed. Try again.",
      });

      return result.fail(
        new Error("The previous avatar upload remains stored.")
      );
    }

    uploadedAvatar.current = null;

    const contentType = avatarContentTypeSchema.safeParse(avatar.type);

    if (!contentType.success) {
      form.setError("avatar", {
        message: "Choose a JPEG, PNG, or WebP image.",
      });

      return result.fail(new Error("The avatar content type is unsupported."));
    }

    const uploaded = await result.trycatch(
      async () =>
        await upload(createAvatarPathname(user.id, contentType.data), avatar, {
          access: "private",
          contentType: contentType.data,
          handleUploadUrl: "/api/uploads/avatar",
        })
    );

    if (!uploaded.ok) {
      const currentSession = await result.trycatch(
        async () => await authClient.getSession()
      );

      if (currentSession.ok && currentSession.value.data === null) {
        router.replace("/sign-in");
        router.refresh();

        return result.fail(uploaded.error);
      }

      form.setError("avatar", {
        message:
          "The avatar upload was interrupted. Your selection is still here. Try again.",
      });

      return result.fail(uploaded.error);
    }

    const image = uploaded.value.url;
    uploadedAvatar.current = {
      file: avatar,
      state: "uncommitted",
      url: image,
    };

    return result.pass(image);
  };

  const saveProfile = async (settings: ProfileSettings) => {
    // Resolve the selected file to one private Blob, reusing a completed upload.
    const resolvedAvatar = await resolveAvatar(settings.avatar);

    if (!resolvedAvatar.ok) {
      return;
    }

    const image = resolvedAvatar.value;

    // Persist the identity update only after its optional avatar is available.
    const update: ProfileSettingsUpdate = {
      name: settings.name,
      username: settings.username,
    };

    if (image !== null) {
      update.image = image;

      const completedUpload = uploadedAvatar.current;

      if (completedUpload?.url === image) {
        completedUpload.state = "update-outcome-unknown";
      }
    }

    const response = await result.trycatch(
      async () => await authClient.updateUser(update)
    );

    if (!response.ok) {
      // The request may have committed before its response was lost. Preserve the
      // uploaded Blob until a later retry confirms the Better Auth outcome.
      form.setError("root", {
        message:
          "The profile service could not be reached. Your edits are still here. Try again.",
      });
      return;
    }

    if (response.value.error !== null) {
      const completedUpload = uploadedAvatar.current;

      if (image !== null && completedUpload?.url === image) {
        completedUpload.state = "uncommitted";
      }

      if (response.value.error.status === 401) {
        router.replace("/sign-in");
        router.refresh();
        return;
      }

      // Retain a completed upload so correcting another field does not re-upload it.
      const issue = getProfileUpdateIssue(response.value.error);
      form.setError(issue.field, { message: issue.message });
      return;
    }

    if (image !== null) {
      uploadedAvatar.current = null;
    }

    // Remove the previous committed avatar only after its replacement is saved.
    const previousAvatar =
      user.image === null || user.image === undefined
        ? null
        : parseOwnedPrivateAvatarUrl(user.image, user.id);

    if (
      image !== null &&
      previousAvatar !== null &&
      previousAvatar.toString() !== image
    ) {
      void deleteStoredAvatar(previousAvatar.toString());
    }

    // Commit the accepted values back into the form and shared session view.
    form.reset({
      avatar: undefined,
      name: settings.name,
      username: settings.username,
    });
    setAvatarPreview(undefined);
    if (avatarInput.current !== null) {
      avatarInput.current.value = "";
    }
    router.refresh();
    toast.add({
      description: "Your changes are now reflected throughout templ8.",
      title: "Profile updated",
      type: "success",
    });
  };

  const submitProfile = (event: SubmitEvent<HTMLFormElement>) => {
    void form.handleSubmit(saveProfile)(event);
  };

  const captureAvatarInput = (element: HTMLInputElement | null) => {
    avatarInput.current = element;
  };

  return {
    captureAvatarInput,
    displayedImage,
    form,
    resetProfile,
    setAvatarPreview,
    submitProfile,
    user,
  };
};

const ProfileSettingsForm = () => {
  const {
    captureAvatarInput,
    displayedImage,
    form,
    resetProfile,
    setAvatarPreview,
    submitProfile,
    user,
  } = useProfileSettingsForm();
  const { errors, isDirty, isSubmitting } = form.formState;

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
              captureInput={captureAvatarInput}
              control={form.control}
              image={displayedImage}
              isAnonymous={user.isAnonymous === true}
              onSelect={setAvatarPreview}
            />

            <FieldGroup className="gap-4">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settings-name">Name</FieldLabel>
                    <Input
                      {...field}
                      aria-describedby="settings-name-description"
                      aria-errormessage={
                        fieldState.invalid ? "settings-name-error" : undefined
                      }
                      aria-invalid={fieldState.invalid}
                      autoComplete="name"
                      id="settings-name"
                    />
                    <FieldDescription id="settings-name-description">
                      This is the name shown throughout the application.
                    </FieldDescription>
                    <FieldError
                      errors={[fieldState.error]}
                      id="settings-name-error"
                    />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="username"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settings-username">
                      Username
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>@</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        aria-describedby="settings-username-description"
                        aria-errormessage={
                          fieldState.invalid
                            ? "settings-username-error"
                            : undefined
                        }
                        aria-invalid={fieldState.invalid}
                        autoCapitalize="none"
                        autoComplete="username"
                        id="settings-username"
                        placeholder="username"
                        spellCheck={false}
                      />
                    </InputGroup>
                    <FieldDescription id="settings-username-description">
                      Use letters, numbers, underscores, and single periods
                      between characters.
                    </FieldDescription>
                    <FieldError
                      errors={[fieldState.error]}
                      id="settings-username-error"
                    />
                  </Field>
                )}
              />
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
