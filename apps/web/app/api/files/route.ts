import { createRouteHandler } from "files-sdk/next";

import { env } from "@/env";
import { auth } from "@/lib/auth/auth-server";
import { files } from "@/lib/files/files-service";
import { createUserFilesRouter } from "@/lib/files/user-files-router";
import type { ReadUserFileSession } from "@/lib/files/user-files-router";

/**
 * Reads the Better Auth session attached to a private file request.
 *
 * @param request - The gateway request carrying the caller's session cookies.
 * @returns The current session, or null when no session is present.
 */
const readUserFileSession: ReadUserFileSession = async (request) =>
  await auth.api.getSession({ headers: request.headers });

/**
 * The authenticated, read-only gateway for private user media.
 */
const userFilesRouter = createUserFilesRouter({
  files,
  readSession: readUserFileSession,
  secret: env.BETTER_AUTH_SECRET,
});

/**
 * Serves private file bytes after session and namespace authorization.
 */
const { GET } = createRouteHandler(userFilesRouter);

export { GET };
