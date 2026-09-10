import { option } from "./option.js";
import type { Option } from "./option.js";

/**
 * The success branch of a Result. Narrows to { ok: true } with the carried
 * value accessible via .value.
 *
 * @example
 * ```ts
 * const p: Pass<number> = result.pass(42)
 * p.value // 42
 * ```
 */
type Pass<T> = Readonly<{ ok: true; value: T }>;

/**
 * The failure branch of a Result. Narrows to { ok: false } with the error
 * accessible via .error. E is constrained to Error subclasses so message,
 * stack, and cause are always available.
 *
 * @example
 * ```ts
 * const f: Fail<TypeError> = result.fail(new TypeError("bad input"))
 * f.error // TypeError
 * ```
 */
type Fail<E extends Error = Error> = Readonly<{ ok: false; error: E }>;

/**
 * A computation that either succeeded with value T or failed with error E.
 * Check .ok to narrow before reading .value or .error.
 *
 * @example
 * ```ts
 * const loaded: Result<User> = result.trycatch(() => db.getUser(id))
 *
 * if (loaded.ok) {
 *     return loaded.value
 * }
 *
 * throw loaded.error
 * ```
 */
type Result<T, E extends Error = Error> = Pass<T> | Fail<E>;

/**
 * Construct a successful Result carrying the given value.
 */
const pass = <T>(value: T): Pass<T> => ({ ok: true, value }) as const;

/**
 * Construct a failed Result carrying the given error.
 */
const fail = <E extends Error>(error: E): Fail<E> =>
  ({ error, ok: false }) as const;

/**
 * Coerce an unknown rejection cause into a Fail<Error>.
 */
const onReject = (cause: unknown): Fail =>
  fail(cause instanceof Error ? cause : new Error(String(cause)));

/**
 * Execute an async thunk and capture the outcome as a Result.
 */
function trycatch<T>(fn: () => Promise<T>): Promise<Result<T>>;
/**
 * Execute a synchronous thunk and capture the outcome as a Result.
 */
function trycatch<T>(fn: () => T): Result<T>;

function trycatch<T>(fn: () => T | Promise<T>): Result<T> | Promise<Result<T>> {
  try {
    const value = fn();
    if (value instanceof Promise) {
      return value.then(pass, onReject);
    }
    return pass(value);
  } catch (error) {
    return onReject(error);
  }
}

/**
 * Walk an error's cause chain looking for an instance of the given constructor.
 * Returns the matched error or option.none if no match is found.
 */
const is = <E extends Error>(
  error: Error,
  ctor: new (...args: never[]) => E,
  depth = 50
): Option<E> => {
  let current: unknown = error;
  for (let i = 0; i < depth && current instanceof Error; i += 1) {
    if (current instanceof ctor) {
      return current;
    }
    current = current.cause;
  }
  return option.none;
};

/**
 * Result namespace for fallible operations.
 *
 * @example
 * ```ts
 * import { result } from "@workspace/utils/result"
 *
 * const parsed = result.trycatch(() => JSON.parse(raw))
 * if (!parsed.ok) {
 *     throw new Error("config parse failed", { cause: parsed.error })
 * }
 *
 * const config = parsed.value
 * ```
 */
const result = { fail, is, pass, trycatch } as const;

export type { Fail, Pass, Result };
export { result };
