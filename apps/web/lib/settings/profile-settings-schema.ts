import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
import { z } from "zod";

import { avatarFileSchema } from "@/lib/profile/avatar";

const profileSettingsSchema = z.object({
  avatar: avatarFileSchema.optional(),
  name: nameSchema,
  username: usernameSchema,
});

type ProfileSettingsFields = z.input<typeof profileSettingsSchema>;
type ProfileSettings = z.output<typeof profileSettingsSchema>;

export { profileSettingsSchema };
export type { ProfileSettings, ProfileSettingsFields };
