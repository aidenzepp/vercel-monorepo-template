import "server-only";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema/auth";
import { env } from "@/env";

/**
 * Server-only Drizzle client bound to the web application's Better Auth schema.
 */
const db = drizzle(env.DATABASE_URL, { schema });

export { db };
