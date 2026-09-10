import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { openAPI } from "better-auth/plugins";
import { anonymous } from "better-auth/plugins/anonymous";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";

import { usernamePluginOptions } from "@/lib/auth/username";

const createAuthPlugins = () => [
  anonymous(),
  apiKey(),
  organization(),
  passkey(),
  twoFactor(),
  username(usernamePluginOptions),
  openAPI(),
];

export { createAuthPlugins };
