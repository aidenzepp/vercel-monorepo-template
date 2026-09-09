import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins/admin";
import type { Auth } from "better-auth/types";
import { drizzle } from "drizzle-orm/neon-http";

import type { SendAuthEmail } from "@/lib/auth/auth-foundation";
import { createAuthFoundationPlugins } from "@/lib/auth/auth-foundation";

const ignoreAuthEmail: SendAuthEmail = () => {
  // Better Auth requires these callbacks in its schema config but does not run them.
};

const authConfig = {
  baseURL: "http://localhost:3000",
  database: drizzleAdapter(drizzle.mock(), {
    provider: "pg",
    schemaName: "auth",
  }),
  plugins: [
    admin(),
    dash({ activityTracking: { enabled: true } }),
    ...createAuthFoundationPlugins({
      appName: "App",
      baseURL: "http://localhost:3000",
      sendEmail: ignoreAuthEmail,
    }),
  ],
  rateLimit: { storage: "database" as const },
};

const auth: Auth<typeof authConfig> = betterAuth(authConfig);

export { auth };
