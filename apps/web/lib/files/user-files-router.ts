import "server-only";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import { FilesError } from "files-sdk";
import type { Files } from "files-sdk";
import { createFilesRouter } from "files-sdk/api";
import type { Authorize, FilesApi } from "files-sdk/api";

import { isProfileAvatarKey } from "@/lib/files/profile-avatar";

/**
 * The authenticated identity required to scope a private user-file request.
 */
interface UserFileSession {
  user: {
    id: string;
    isAnonymous?: boolean | null;
  };
}

/**
 * Reads the optional authenticated identity carried by a file request.
 *
 * @param request - The incoming request whose headers contain session cookies.
 * @returns The current session, or null when the request is unauthenticated.
 */
type ReadUserFileSession = (
  request: Request
) => Promise<UserFileSession | null>;

/**
 * Dependencies required to expose private user files through the SDK gateway.
 */
interface CreateUserFilesRouterOptions {
  files: Files;
  readSession: ReadUserFileSession;
  secret: string;
}

/**
 * The response policy selected by an explicitly recognized user-file key.
 */
interface UserFilePolicy {
  disposition: "inline";
}

/**
 * Parses a caller-facing key into the policy owned by its file namespace.
 *
 * Unknown namespaces and malformed avatar names deliberately have no policy.
 * A future namespace earns another explicit parser and authorization rule here.
 *
 * @param key - The untrusted key supplied through the files gateway.
 * @returns The matched namespace policy, or null when access must be denied.
 */
const parseUserFileKey = (key: string): UserFilePolicy | null =>
  isProfileAvatarKey(key) ? { disposition: "inline" } : null;

/**
 * Prevents authenticated file bytes from being retained by browser or shared
 * caches after the route's authorization decision.
 *
 * @param response - The Files SDK response whose body and status are preserved.
 * @returns An equivalent response carrying an explicit private cache policy.
 */
const applyPrivateFileResponsePolicy = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.append("Vary", "Cookie");

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

/**
 * Constructs per-request authorization for private user files.
 *
 * @param readSession - Resolves the Better Auth identity from request headers.
 * @returns The Files SDK authorization hook that applies user and namespace
 *   scope.
 */
const createUserFileAuthorizer =
  (readSession: ReadUserFileSession): Authorize =>
  async ({ key, req }) => {
    const session = await result.trycatch(async () => await readSession(req));

    if (!session.ok) {
      logger.error(
        { err: session.error, operation: "files.session.read" },
        "Private file session read failed"
      );
      throw new FilesError(
        "Provider",
        "Private file authorization is unavailable.",
        session.error
      );
    }

    if (session.value === null || session.value.user.isAnonymous === true) {
      throw new FilesError(
        "Unauthorized",
        "Sign in with a permanent account to access this file."
      );
    }

    const policy = key === undefined ? null : parseUserFileKey(key);

    if (policy === null) {
      throw new FilesError("NotFound", "File not found.");
    }

    return {
      disposition: policy.disposition,
      keyPrefix: `users/${session.value.user.id}/`,
    };
  };

/**
 * Constructs the read-only Files SDK gateway for authenticated user media.
 *
 * Downloads are always proxied so the application authenticates every request
 * and never exposes a provider URL to the browser.
 *
 * @param options - The file service, session reader, and gateway signing
 *   secret.
 * @param options.files - Reads private objects after authorization scopes them.
 * @param options.readSession - Resolves the current Better Auth session.
 * @param options.secret - Stabilizes the SDK's internal gateway token contract.
 * @returns A Web Request router that only serves authorized downloads.
 * @see https://files-sdk.dev/docs/ui/server/gateway
 * @see https://files-sdk.dev/docs/ui/server/authorization
 */
const createUserFilesRouter = (
  options: CreateUserFilesRouterOptions
): FilesApi => {
  const router = createFilesRouter({
    authorize: createUserFileAuthorizer(options.readSession),
    downloadMode: "proxy",
    files: options.files.readonly(),
    operations: ["download"],
    secret: options.secret,
  });

  return {
    handle: async (request) =>
      applyPrivateFileResponsePolicy(await router.handle(request)),
  };
};

export { createUserFilesRouter };
export type { ReadUserFileSession };
