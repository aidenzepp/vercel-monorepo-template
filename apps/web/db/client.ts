import "server-only";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema/auth";
import { env } from "@/env";

const db = drizzle(env.DATABASE_URL, { schema });

export { db };
