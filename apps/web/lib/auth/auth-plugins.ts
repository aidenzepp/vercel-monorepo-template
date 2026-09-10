import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { usernamePluginOptions } from "@workspace/better-auth/config/username";
import { openAPI } from "better-auth/plugins";
import { anonymous } from "better-auth/plugins/anonymous";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";

/**
 * Create a fresh, identical plugin set for runtime auth and schema generation.
 * Better Auth derives adapter fields from enabled plugins, so sharing their
 * configuration prevents the generated schema from drifting from production.
 */
const createAuthPlugins = () =>
  [
    anonymous(),
    apiKey(),
    organization(),
    passkey(),
    twoFactor(),
    username(usernamePluginOptions),
    openAPI(),
  ] as const;

export { createAuthPlugins };
