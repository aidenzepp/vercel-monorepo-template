import { getVercelOidcToken } from "@vercel/oidc";
import { createRouteHandler } from "files-sdk/next";

import { env } from "@/env";
import { auth } from "@/lib/auth/auth-server";
import { FileService } from "@/lib/files/files-service";
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
 * Constructs private Blob storage after Vercel establishes request OIDC state.
 *
 * @returns A request-authenticated file service for the private user gateway.
 * @see https://vercel.com/docs/oidc/reference#other-cloud-providers
 */
const createRequestFileService = async (): Promise<FileService> =>
  new FileService({
    access: "private",
    oidcToken: await getVercelOidcToken(),
    storeId: env.BLOB_STORE_ID,
  });

/**
 * The authenticated gateway for private user media and upload metadata.
 */
const userFilesRouter = createUserFilesRouter({
  files: createRequestFileService,
  readSession: readUserFileSession,
  secret: env.BETTER_AUTH_SECRET,
});

/**
 * Serves private file bytes after session and namespace authorization.
 */
const { GET, POST } = createRouteHandler(userFilesRouter);

export { GET, POST };
