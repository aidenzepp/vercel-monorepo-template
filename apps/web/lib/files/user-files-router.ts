import "server-only";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";
import { FilesError } from "files-sdk";
import type { Files } from "files-sdk";
import { createFilesRouter } from "files-sdk/api";
import type { Authorize, AuthorizeContext, FilesApi } from "files-sdk/api";
import { z } from "zod";

import {
  isProfileAvatarKey,
  MAX_AVATAR_SIZE_IN_BYTES,
  PROFILE_AVATAR_NAMESPACE,
  validateProfileAvatarUploadMetadata,
} from "@/lib/files/profile-avatar";

/**
 * The maximum lifetime granted to one browser-direct avatar upload.
 */
const PROFILE_AVATAR_UPLOAD_EXPIRES_IN_SECONDS = 60;

/**
 * Parses the file metadata carried by a Files SDK avatar presign request.
 */
const profileAvatarPresignRequestSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
    })
  ),
  op: z.literal("presign"),
});

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
 * A cached session read shared by gateway policy checks for one request.
 */
type ReadUserFileSessionResult = (
  request: Request
) => Promise<Result<UserFileSession | null>>;

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
 * Determines whether a request selected the explicit avatar upload namespace.
 *
 * @param request - The file request whose endpoint query selects a namespace.
 * @returns True only for the registered profile-avatar upload namespace.
 */
const isProfileAvatarUploadRequest = (request: Request): boolean =>
  new URL(request.url).searchParams.get("namespace") ===
  PROFILE_AVATAR_NAMESPACE;

/**
 * Serializes one product validation failure in the Files SDK error envelope.
 *
 * @param message - The safe repair guidance shared with the avatar field.
 * @param reason - The machine-readable upload constraint that failed.
 * @returns A gateway validation response compatible with the Files SDK client.
 */
const createUploadValidationResponse = (
  message: string,
  reason: "count" | "size" | "type"
): Response =>
  Response.json(
    { error: { code: "Validation", message, reason } },
    { status: 422 }
  );

/**
 * Creates a request-local session cache for authorization and presign policy.
 *
 * @param readSession - Resolves the Better Auth identity from request headers.
 * @returns A reader that invokes the underlying session lookup once per
 *   request.
 */
const createCachedUserFileSessionReader = (
  readSession: ReadUserFileSession
): ReadUserFileSessionResult => {
  const requests = new WeakMap<
    Request,
    Promise<Result<UserFileSession | null>>
  >();

  return async (request) => {
    const cached = requests.get(request);

    if (cached !== undefined) {
      return await cached;
    }

    const pending = result.trycatch(async () => await readSession(request));
    requests.set(request, pending);
    return await pending;
  };
};

/**
 * Rejects avatar metadata that must not receive signed storage access.
 *
 * Authentication remains authoritative: unauthenticated callers continue into
 * the SDK authorizer so they receive an authorization response before product
 * validation details.
 *
 * @param request - The incoming Files SDK request.
 * @param readSession - Reads the cached identity attached to the request.
 * @returns A validation response, or `null` when the SDK should continue.
 */
const getProfileAvatarUploadRejection = async (
  request: Request,
  readSession: ReadUserFileSessionResult
): Promise<Response | null> => {
  if (request.method !== "POST" || !isProfileAvatarUploadRequest(request)) {
    return null;
  }

  const session = await readSession(request);

  if (
    !session.ok ||
    session.value === null ||
    session.value.user.isAnonymous === true
  ) {
    return null;
  }

  const parsed = await result.trycatch(async () =>
    profileAvatarPresignRequestSchema.safeParse(await request.clone().json())
  );

  if (!parsed.ok || !parsed.value.success) {
    return null;
  }

  if (parsed.value.data.files.length !== 1) {
    return createUploadValidationResponse(
      "Choose one avatar image at a time.",
      "count"
    );
  }

  const file = parsed.value.data.files.at(0);

  if (file === undefined) {
    return null;
  }

  const validated = validateProfileAvatarUploadMetadata(file);

  if (validated.ok) {
    return null;
  }

  const reason =
    !Number.isFinite(file.size) ||
    file.size < 0 ||
    file.size > MAX_AVATAR_SIZE_IN_BYTES
      ? "size"
      : "type";

  return createUploadValidationResponse(validated.error.message, reason);
};

/**
 * Rejects byte uploads through the application while leaving signed provider
 * targets available to the browser.
 *
 * @returns The stable gateway response for a disallowed application upload.
 */
const createApplicationUploadRejection = (): Response =>
  Response.json(
    {
      error: {
        code: "Forbidden",
        message: "Upload image bytes directly to the signed storage target.",
      },
    },
    { status: 403 }
  );

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
  (readSession: ReadUserFileSessionResult): Authorize =>
  async ({ key, operation, req }: AuthorizeContext) => {
    const session = await readSession(req);

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

    if (operation === "upload" && key === undefined) {
      if (!isProfileAvatarUploadRequest(req)) {
        throw new FilesError("NotFound", "File namespace not found.");
      }

      return {
        keyPrefix: `users/${session.value.user.id}/${PROFILE_AVATAR_NAMESPACE}/`,
        maxExpiresIn: PROFILE_AVATAR_UPLOAD_EXPIRES_IN_SECONDS,
      };
    }

    const policy =
      operation === "download" && key !== undefined
        ? parseUserFileKey(key)
        : null;

    if (policy === null) {
      throw new FilesError("NotFound", "File not found.");
    }

    return {
      disposition: policy.disposition,
      keyPrefix: `users/${session.value.user.id}/`,
    };
  };

/**
 * Constructs the Files SDK gateway for authenticated private user media.
 *
 * Downloads are always proxied so the application authenticates every request
 * and never exposes a provider URL to the browser. Upload requests carry only
 * metadata and completion tokens; image bytes must use the signed provider
 * target returned to the client.
 *
 * @param options - The file service, session reader, and gateway signing
 *   secret.
 * @param options.files - Reads private objects and signs constrained uploads.
 * @param options.readSession - Resolves the current Better Auth session.
 * @param options.secret - Stabilizes the SDK's internal gateway token contract.
 * @returns A Web Request router for authorized reads and direct-upload setup.
 * @see https://files-sdk.dev/docs/ui/server/gateway
 * @see https://files-sdk.dev/docs/ui/server/authorization
 */
const createUserFilesRouter = (
  options: CreateUserFilesRouterOptions
): FilesApi => {
  const readSession = createCachedUserFileSessionReader(options.readSession);
  const router = createFilesRouter({
    authorize: createUserFileAuthorizer(readSession),
    downloadMode: "proxy",
    files: options.files,
    maxUploadSize: MAX_AVATAR_SIZE_IN_BYTES,
    operations: ["download", "upload"],
    secret: options.secret,
  });

  return {
    handle: async (request) => {
      if (request.method === "PUT") {
        return applyPrivateFileResponsePolicy(
          createApplicationUploadRejection()
        );
      }

      const uploadRejection = await getProfileAvatarUploadRejection(
        request,
        readSession
      );

      return applyPrivateFileResponsePolicy(
        uploadRejection ?? (await router.handle(request))
      );
    },
  };
};

export { createUserFilesRouter };
export type { ReadUserFileSession };
