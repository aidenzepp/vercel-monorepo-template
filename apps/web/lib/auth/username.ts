import type { UsernameOptions } from "better-auth/plugins/username";
import { z } from "zod";

const USERNAME_MIN_LENGTH = 1;
const USERNAME_MAX_LENGTH = 30;

const normalizeUsername = (value: string): string => value.trim().toLowerCase();

const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(USERNAME_MIN_LENGTH)
      .max(USERNAME_MAX_LENGTH)
      .regex(/^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]+$/u)
  );

const usernamePluginOptions = {
  displayUsername: false,
  maxUsernameLength: USERNAME_MAX_LENGTH,
  minUsernameLength: USERNAME_MIN_LENGTH,
  usernameNormalization: normalizeUsername,
  usernameValidator: (value: string): boolean =>
    usernameSchema.safeParse(value).success,
  validationOrder: { username: "post-normalization" },
} as const satisfies UsernameOptions & { displayUsername: false };

export {
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  usernamePluginOptions,
  usernameSchema,
};
