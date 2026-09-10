import { z } from "zod";

/** The shortest stored name accepted after surrounding whitespace is removed. */
const NAME_MIN_LENGTH = 1;

/** The longest stored name accepted by the shared authentication boundary. */
const NAME_MAX_LENGTH = 50;

/**
 * Parses a user-chosen name into the representation persisted by Better Auth.
 *
 * Names may contain Unicode and internal whitespace. Trimming prevents visually
 * empty values and accidental padding without rewriting the user's spelling.
 */
const nameSchema = z
  .string()
  .trim()
  .min(NAME_MIN_LENGTH, "Enter a name.")
  .max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or fewer.`)
  .brand<"ProfileName">();

/** A stored name that has passed every shared name invariant. */
type ProfileName = z.infer<typeof nameSchema>;

export { NAME_MAX_LENGTH, NAME_MIN_LENGTH, nameSchema };
export type { ProfileName };
