import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class values and resolves conflicting Tailwind utility
 * classes.
 *
 * @param inputs - Class values accepted by clsx.
 * @returns One normalized class string with Tailwind conflicts resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
