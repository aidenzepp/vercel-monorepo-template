"use client";

import { adminClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  plugins: [adminClient(), lastLoginMethodClient()],
});

export { authClient };
