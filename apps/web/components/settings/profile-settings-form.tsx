"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { upload } from "@vercel/blob/client";
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
import { Spinner } from "@workspace/ui/components/spinner";
import { toast } from "@workspace/ui/components/toast";
import { result } from "@workspace/utils/result";
import { HatGlasses, UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { authClient } from "@/lib/auth/auth-client";
import {
  avatarContentTypeSchema,
  createAvatarPathname,
} from "@/lib/profile/avatar";
import { profileSettingsSchema } from "@/lib/settings/profile-settings-schema";
import type {
  ProfileSettings,
  ProfileSettingsFields,
} from "@/lib/settings/profile-settings-schema";

interface ProfileSettingsFormProps {
  initialImage: string | null;
  initialName: string;
  initialUsername: string | null;
  isAnonymous: boolean;
  userId: string;
}

interface ProfileSettingsIssue {
  field: "name" | "root" | "username";
  message: string;
}

interface ProfileSettingsUpdate {
  image?: string;
  name: string;
  username: string;
}

const profileUpdateError = (error: {
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
        message: "Use only letters, numbers, periods, and underscores.",
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
      message: "Your session expired. Sign in again, then retry.",
    };
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

const ProfileSettingsForm = ({
  initialImage,
  initialName,
  initialUsername,
  isAnonymous,
  userId,
}: ProfileSettingsFormProps) => {
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement | null>(null);
  const avatarPreviewUrl = useRef<string | null>(null);
  const uploadedUrlByFile = useRef(new WeakMap<File, string>());
  const [savedAvatarFile, setSavedAvatarFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const form = useForm<ProfileSettingsFields, unknown, ProfileSettings>({
    defaultValues: {
      avatar: undefined,
      name: initialName,
      username: initialUsername ?? "",
    },
    resolver: zodResolver(profileSettingsSchema),
  });
  const displayedImage = previewUrl ?? initialImage;
  const { errors, isDirty, isSubmitting } = form.formState;

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

  const reset = () => {
    form.reset();
    setAvatarPreview(savedAvatarFile);
    if (avatarInput.current !== null) {
      avatarInput.current.value = "";
    }
  };

  const save = async (settings: ProfileSettings) => {
    let image: string | undefined;
    const { avatar } = settings;

    if (avatar !== undefined) {
      image = uploadedUrlByFile.current.get(avatar);

      if (image === undefined) {
        const contentType = avatarContentTypeSchema.safeParse(avatar.type);

        if (!contentType.success) {
          form.setError("avatar", {
            message: "Choose a JPEG, PNG, or WebP image.",
          });
          return;
        }

        const uploaded = await result.trycatch(
          async () =>
            await upload(
              createAvatarPathname(userId, contentType.data),
              avatar,
              {
                access: "private",
                contentType: contentType.data,
                handleUploadUrl: "/api/uploads/avatar",
              }
            )
        );

        if (!uploaded.ok) {
          form.setError("avatar", {
            message:
              "The avatar upload was interrupted. Your selection is still here. Try again.",
          });
          return;
        }

        image = uploaded.value.url;
        uploadedUrlByFile.current.set(avatar, image);
      }
    }

    const update: ProfileSettingsUpdate = {
      name: settings.name,
      username: settings.username,
    };

    if (image !== undefined) {
      update.image = image;
    }

    const response = await result.trycatch(
      async () => await authClient.updateUser(update)
    );

    if (!response.ok) {
      form.setError("root", {
        message:
          "The profile service could not be reached. Your edits are still here. Try again.",
      });
      return;
    }

    if (response.value.error !== null) {
      const issue = profileUpdateError(response.value.error);
      form.setError(issue.field, { message: issue.message });
      return;
    }

    if (avatar !== undefined) {
      setSavedAvatarFile(avatar);
      setAvatarPreview(avatar);
    }

    form.reset({
      avatar: undefined,
      name: settings.name,
      username: settings.username,
    });
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

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    void form.handleSubmit(save)(event);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Choose how your account appears throughout templ8.
        </CardDescription>
      </CardHeader>

      <form noValidate onSubmit={submit}>
        <CardContent>
          <FieldSet disabled={isSubmitting}>
            <FieldLegend className="sr-only">Profile</FieldLegend>
            <FieldError errors={[errors.root]} />

            <Controller
              control={form.control}
              name="avatar"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="settings-avatar">Avatar</FieldLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="size-20">
                      {displayedImage === null ? null : (
                        <AvatarImage
                          key={displayedImage}
                          alt=""
                          render={
                            <Image
                              alt=""
                              fill
                              sizes="5rem"
                              src={displayedImage}
                              unoptimized
                            />
                          }
                          src={displayedImage}
                        />
                      )}
                      <AvatarFallback>
                        {isAnonymous ? (
                          <HatGlasses aria-hidden="true" />
                        ) : (
                          <UserRound aria-hidden="true" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <Input
                        accept="image/jpeg,image/png,image/webp"
                        aria-describedby="settings-avatar-description"
                        aria-errormessage={
                          fieldState.invalid
                            ? "settings-avatar-error"
                            : undefined
                        }
                        aria-invalid={fieldState.invalid}
                        id="settings-avatar"
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          field.onChange(file);
                          setAvatarPreview(file);
                        }}
                        ref={(element) => {
                          avatarInput.current = element;
                          field.ref(element);
                        }}
                        type="file"
                      />
                      <FieldDescription id="settings-avatar-description">
                        JPEG, PNG, or WebP. Maximum 5 MB.
                      </FieldDescription>
                    </div>
                  </div>
                  <FieldError
                    errors={[fieldState.error]}
                    id="settings-avatar-error"
                  />
                </Field>
              )}
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
                      Use letters, numbers, periods, and underscores.
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
            onClick={reset}
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
