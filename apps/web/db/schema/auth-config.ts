import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins/admin";
import type { Auth } from "better-auth/types";
import { drizzle } from "drizzle-orm/neon-http";

import { createAuthPlugins } from "@/lib/auth/auth-plugins";

const authConfig = {
  database: drizzleAdapter(drizzle.mock(), {
    provider: "pg",
    schemaName: "auth",
  }),
  plugins: [
    admin(),
    dash({ activityTracking: { enabled: true } }),
    ...createAuthPlugins(),
  ],
};

const auth: Auth<typeof authConfig> = betterAuth(authConfig);

export { auth };
