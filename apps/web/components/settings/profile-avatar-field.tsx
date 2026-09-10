"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { HatGlasses, UserRound } from "lucide-react";
import Image from "next/image";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";

import type { ProfileSettingsFields } from "@/lib/settings/profile-settings-schema";

interface ProfileAvatarFieldProps {
  captureInput: (element: HTMLInputElement | null) => void;
  control: Control<ProfileSettingsFields>;
  image: string | null;
  isAnonymous: boolean;
  onSelect: (file: File | undefined) => void;
}

/** Renders the avatar preview and binds its file input to the profile form. */
const ProfileAvatarField = ({
  captureInput,
  control,
  image,
  isAnonymous,
  onSelect,
}: ProfileAvatarFieldProps) => (
  <Controller
    control={control}
    name="avatar"
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor="settings-avatar">Avatar</FieldLabel>
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            {image === null ? null : (
              <AvatarImage
                key={image}
                alt=""
                render={
                  <Image alt="" fill sizes="5rem" src={image} unoptimized />
                }
                src={image}
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
                fieldState.invalid ? "settings-avatar-error" : undefined
              }
              aria-invalid={fieldState.invalid}
              id="settings-avatar"
              name={field.name}
              onBlur={field.onBlur}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                field.onChange(file);
                onSelect(file);
              }}
              ref={(element) => {
                captureInput(element);
                field.ref(element);
              }}
              type="file"
            />
            <FieldDescription id="settings-avatar-description">
              JPEG, PNG, or WebP. Maximum 5 MB.
            </FieldDescription>
          </div>
        </div>
        <FieldError errors={[fieldState.error]} id="settings-avatar-error" />
      </Field>
    )}
  />
);

export { ProfileAvatarField };
