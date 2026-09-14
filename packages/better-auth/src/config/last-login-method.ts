import type { LastLoginMethodOptions } from "better-auth/plugins";

/**
 * Better Auth configuration shared by tracking and request-cookie reads.
 *
 * Naming the cookie explicitly keeps server rendering aligned with the plugin
 * if Better Auth's default ever changes.
 */
const lastLoginMethodOptions = {
  cookieName: "better-auth.last_used_login_method",
} as const satisfies LastLoginMethodOptions;

export { lastLoginMethodOptions };
