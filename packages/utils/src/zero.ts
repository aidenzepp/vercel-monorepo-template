import { option } from "@workspace/utils/option";
import type { Option } from "@workspace/utils/option";

/**
 * A factory that returns the zero value for T.
 */
type Zero<T> = () => T;

/**
 * Return an empty array. Each call creates a fresh array.
 *
 * @returns A fresh empty array.
 */
const array = <T>(): T[] => [];

/**
 * Return the zero bigint.
 *
 * @returns The bigint zero value.
 */
const bigint = (): bigint => 0n;

/**
 * Return the zero boolean.
 *
 * @returns The boolean zero value.
 */
const boolean = (): boolean => false;

/**
 * Return an empty Map. Each call creates a fresh map.
 *
 * @returns A fresh empty map.
 */
const map = <K, V>(): Map<K, V> => new Map();

/**
 * Return the zero number.
 *
 * @returns The numeric zero value.
 */
const number = (): number => 0;

/**
 * Return an empty record. Each call creates a fresh object.
 *
 * @returns A fresh empty string-keyed record.
 */
const record = <T>(): Record<string, T> => ({});

/**
 * Return an empty Set. Each call creates a fresh set.
 *
 * @returns A fresh empty set.
 */
const set = <T>(): Set<T> => new Set();

/**
 * Return the zero string.
 *
 * @returns The empty string.
 */
const string = (): string => "";

/**
 * Return value when present, otherwise call the supplied zero factory.
 *
 * @param value - The optional value to preserve when present.
 * @param zero - The lazy factory for the absent case.
 * @returns The present value or its zero fallback.
 */
const fallback = <T>(value: Option<T>, zero: Zero<T>): T =>
  value === option.none ? zero() : value;

/**
 * Zero value helpers for primitives and common containers.
 */
const zero = {
  array,
  bigint,
  boolean,
  fallback,
  map,
  number,
  record,
  set,
  string,
} as const;

export type { Zero };
export { zero };
