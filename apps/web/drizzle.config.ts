import { defineConfig } from "drizzle-kit";

import { env } from "./env";

/**
 * Direct Neon connection used only by Drizzle Kit schema commands.
 */
const databaseUrl = env.DATABASE_URL_UNPOOLED;

if (databaseUrl === undefined || databaseUrl === "") {
  throw new Error(
    "DATABASE_URL_UNPOOLED is required for Drizzle Kit commands."
  );
}

export default defineConfig({
  dbCredentials: { url: databaseUrl },
  dialect: "postgresql",
  out: "./db/migrations",
  schema: "./db/schema/*.ts",
  strict: true,
  verbose: true,
});
