/**
 * A value that may or may not exist. Implemented as T | undefined, which keeps
 * Option compatible with optional properties, ?. chaining, Map.get, array
 * indexing, and the rest of the JavaScript ecosystem.
 *
 * @example
 * ```ts
 * const user: Option<User> = users.get(id)
 * if (user !== option.none) {
 *     return user.name
 * }
 * ```
 */
type Option<T> = T | typeof none;

/**
 * The absent value. Reads as intentional absence rather than a forgotten return.
 */
const none = undefined;

/**
 * Construct a present Option value. This is the identity function; it marks a
 * value as intentionally present without adding a wrapper.
 */
const some = <T>(value: T): T => value;

/**
 * Option namespace for nullable values.
 */
const option = { none, some } as const;

export type { Option };
export { option };
