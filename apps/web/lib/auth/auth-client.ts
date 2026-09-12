"use client";

import { apiKeyClient } from "@better-auth/api-key/client";
import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  anonymousClient,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Browser Better Auth client with companions for every enabled server plugin.
 *
 * @see https://better-auth.com/docs/concepts/client
 */
const authClient = createAuthClient({
  plugins: [
    adminClient(),
    anonymousClient(),
    apiKeyClient(),
    lastLoginMethodClient(),
    organizationClient(),
    passkeyClient(),
    twoFactorClient(),
    usernameClient(),
  ],
});

export { authClient };
