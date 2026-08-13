import { option } from "./option.js";
import type { Option } from "./option.js";

/**
 * A factory that returns the zero value for T.
 */
type Zero<T> = () => T;

/**
 * Return an empty array. Each call creates a fresh array.
 */
const array = <T>(): T[] => [];

/**
 * Return the zero bigint.
 */
const bigint = (): bigint => 0n;

/**
 * Return the zero boolean.
 */
const boolean = (): boolean => false;

/**
 * Return an empty Map. Each call creates a fresh map.
 */
const map = <K, V>(): Map<K, V> => new Map();

/**
 * Return the zero number.
 */
const number = (): number => 0;

/**
 * Return an empty record. Each call creates a fresh object.
 */
const record = <T>(): Record<string, T> => ({});

/**
 * Return an empty Set. Each call creates a fresh set.
 */
const set = <T>(): Set<T> => new Set();

/**
 * Return the zero string.
 */
const string = (): string => "";

/**
 * Return value when present, otherwise call the supplied zero factory.
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
