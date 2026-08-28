import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins";
import type { Auth } from "better-auth/types";
import { drizzle } from "drizzle-orm/neon-http";

const authConfig = {
  database: drizzleAdapter(drizzle.mock(), {
    provider: "pg",
    schemaName: "auth",
  }),
  plugins: [admin()],
};

const auth: Auth<typeof authConfig> = betterAuth(authConfig);

export { auth };
