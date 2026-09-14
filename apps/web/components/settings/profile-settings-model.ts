import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
import { z } from "zod";

import type { Session } from "@/components/auth/session-provider";

/**
 * Accepts an unset username while normalizing it for persistence comparisons.
 */
const profileUsernameSchema = z
  .union([usernameSchema, z.literal("")])
  .optional()
  .transform((username) => username ?? "");

/**
 * The identity values recorded after they reach Better Auth successfully.
 */
const savedProfileIdentitySchema = z.object({
  name: nameSchema,
  username: profileUsernameSchema,
});

/**
 * Accepts profile fields and the avatar states required for safe retries.
 */
const profileSettingsSchema = z.object({
  avatar: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("persisted"), url: z.string().nullable() }),
    z.object({
      file: z.custom<File>(),
      kind: z.literal("selected"),
      previewUrl: z.string(),
      savedIdentity: savedProfileIdentitySchema.optional(),
    }),
    z.object({
      file: z.custom<File>(),
      key: z.string(),
      kind: z.literal("pending"),
      previewUrl: z.string(),
      savedIdentity: savedProfileIdentitySchema,
    }),
    z.object({
      file: z.custom<File>(),
      kind: z.literal("uploaded"),
      previewUrl: z.string(),
      savedIdentity: savedProfileIdentitySchema,
      url: z.string(),
    }),
  ]),
  name: nameSchema,
  username: profileUsernameSchema,
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
 * The persisted, selected, or repair state for the avatar field.
 */
type ProfileAvatarState = ProfileSettings["avatar"];

/**
 * The session fields required to initialize profile settings.
 */
type ProfileSettingsUser = Pick<Session["user"], "image" | "name" | "username">;

/**
 * Better Auth user fields changed by the profile save operation.
 */
interface ProfileUserUpdate {
  image?: string;
  name?: string;
  username?: string;
}

export { profileSettingsSchema };
export type {
  ProfileAvatarState,
  ProfileSettings,
  ProfileSettingsFields,
  ProfileSettingsUser,
  ProfileUserUpdate,
};
