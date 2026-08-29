"use client";

import { sentinelClient } from "@better-auth/infra/client";
import { adminClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  plugins: [
    adminClient(),
    lastLoginMethodClient(),
    sentinelClient({ autoSolveChallenge: true }),
  ],
});

export { authClient };
