import type { UsernameOptions } from "better-auth/plugins/username";
import { z } from "zod";

/**
 * The shortest canonical username accepted at shared authentication boundaries.
 *
 * One-character usernames are intentional: the foundation does not impose a
 * longer identity format than its consumers currently require.
 */
const USERNAME_MIN_LENGTH = 1;

/**
 * The longest canonical username accepted at shared authentication boundaries.
 *
 * Keeping this limit beside the parser prevents availability checks and final
 * writes from accepting different values.
 */
const USERNAME_MAX_LENGTH = 30;

/**
 * Produces the canonical username used for storage and comparison.
 *
 * Trimming and lowercasing make capitalization and accidental surrounding
 * whitespace irrelevant to uniqueness without rewriting internal characters.
 */
const normalizeUsername = (value: string): string => value.trim().toLowerCase();

/**
 * Parses raw input into a canonical username.
 *
 * Usernames support ASCII letters, numbers, periods, and underscores. Periods
 * cannot be leading, trailing, or consecutive. Successful parsing preserves
 * those invariants in the branded {@link Username} type.
 */
const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(USERNAME_MIN_LENGTH)
      .max(USERNAME_MAX_LENGTH)
      .regex(/^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]+$/u)
  )
  .brand<"Username">();

/** A canonical username that has passed every shared username invariant. */
type Username = z.infer<typeof usernameSchema>;

/**
 * Better Auth configuration derived from the shared username parser.
 *
 * Validation runs after normalization so persisted usernames and independent
 * request validation share one canonical interpretation. `displayUsername`
 * remains disabled because Better Auth's existing `name` field should own a
 * user's chosen display name rather than introducing a second representation.
 */
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
export type { Username };
