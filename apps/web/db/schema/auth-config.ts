import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import type { Auth } from "better-auth/types";
import { drizzle } from "drizzle-orm/neon-http";

const authConfig = {
  database: drizzleAdapter(drizzle.mock(), {
    provider: "pg",
    schemaName: "auth",
  }),
};

const auth: Auth<typeof authConfig> = betterAuth(authConfig);

export { auth };
