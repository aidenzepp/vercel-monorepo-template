import "server-only";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";
import { FilesError } from "files-sdk";
import type { Files } from "files-sdk";
import { createFilesRouter } from "files-sdk/api";
import type {
  Authorize,
  AuthorizeContext,
  AuthorizeResult,
  FilesApi,
} from "files-sdk/api";
import { z } from "zod";

import {
  isProfileAvatarKey,
  MAX_AVATAR_SIZE_IN_BYTES,
  PROFILE_AVATAR_NAMESPACE,
  ProfileAvatarError,
  validateProfileAvatarUploadMetadata,
} from "@/lib/files/profile-avatar";
import type { ProfileAvatarFileMetadata } from "@/lib/files/profile-avatar";

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
 * Parses upload targets returned by a successful Files SDK presign response.
 */
const profileAvatarPresignResponseSchema = z.object({
  uploads: z
    .array(
      z.object({
        target: z.object({ url: z.string() }),
      })
    )
    .min(1),
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
 * @param issue - The machine-readable reason, guidance, and safe facts.
 * @returns A gateway validation response compatible with the Files SDK client.
 */
const createUploadValidationResponse = (issue: ProfileAvatarError): Response =>
  Response.json(
    {
      error: {
        code: "Validation",
        details: issue.details,
        message: issue.message,
        reason: issue.code,
      },
    },
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
 * Reads avatar metadata from a well-formed Files SDK presign request.
 *
 * @param request - The incoming request whose JSON body is inspected.
 * @returns The submitted file metadata, or null for another JSON operation.
 */
const readProfileAvatarPresignFiles = async (
  request: Request
): Promise<ProfileAvatarFileMetadata[] | null> => {
  const parsed = await result.trycatch(async () =>
    profileAvatarPresignRequestSchema.safeParse(await request.clone().json())
  );

  return parsed.ok && parsed.value.success ? parsed.value.data.files : null;
};

/**
 * Validates the cardinality and metadata for one avatar upload request.
 *
 * @param files - The browser-reported files in the presign request.
 * @returns A structured validation issue, or null when signing may continue.
 */
const getProfileAvatarMetadataIssue = (
  files: ProfileAvatarFileMetadata[]
): ProfileAvatarError | null => {
  if (files.length !== 1) {
    return new ProfileAvatarError("Choose one avatar image at a time.", {
      code: "wrong_file_count",
      phase: "validation",
      retryable: false,
      storageState: "not_uploaded",
    });
  }

  const file = files.at(0);

  if (file === undefined) {
    return null;
  }

  const validated = validateProfileAvatarUploadMetadata(file);
  return validated.ok ? null : validated.error;
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

  const files = await readProfileAvatarPresignFiles(request);

  if (files === null) {
    return null;
  }

  const issue = getProfileAvatarMetadataIssue(files);
  return issue === null ? null : createUploadValidationResponse(issue);
};

/**
 * Determines whether an upload target points back to the application proxy.
 *
 * @param request - The avatar request that established the gateway endpoint.
 * @param target - The upload target returned by Files SDK.
 * @returns True only for the gateway's own proxy-upload operation.
 */
const isApplicationUploadTarget = (
  request: Request,
  target: string
): boolean => {
  const parsed = result.trycatch(() => new URL(target, request.url));

  if (!parsed.ok) {
    return false;
  }

  const gateway = new URL(request.url);
  return (
    parsed.value.origin === gateway.origin &&
    parsed.value.pathname === gateway.pathname &&
    parsed.value.searchParams.get("op") === "proxy"
  );
};

/**
 * Returns safe guidance when direct storage authorization is unavailable.
 *
 * @returns A retryable gateway failure without provider implementation detail.
 */
const createDirectUploadUnavailableResponse = (): Response =>
  Response.json(
    {
      error: {
        code: "Provider",
        message: "Direct file uploads are temporarily unavailable.",
      },
    },
    { status: 503 }
  );

/**
 * Prevents Files SDK from silently downgrading a failed signed upload to an
 * application byte upload.
 *
 * @param request - The original namespaced avatar request.
 * @param response - The Files SDK gateway response to enforce.
 * @returns The direct target response or a normalized 503 failure.
 */
const enforceDirectProfileAvatarUpload = async (
  request: Request,
  response: Response
): Promise<Response> => {
  if (
    !response.ok ||
    request.method !== "POST" ||
    !isProfileAvatarUploadRequest(request)
  ) {
    return response;
  }

  const parsed = await result.trycatch(async () => {
    const json: unknown = await response.clone().json();
    return profileAvatarPresignResponseSchema.parse(json);
  });

  if (
    !parsed.ok ||
    !parsed.value.uploads.some((upload) =>
      isApplicationUploadTarget(request, upload.target.url)
    )
  ) {
    return response;
  }

  logger.error(
    { operation: "files.avatar.reject-upload-proxy-fallback" },
    "Direct avatar upload authorization fell back to the application gateway"
  );
  return createDirectUploadUnavailableResponse();
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
 * Requires the permanent account shared by every private-file operation.
 *
 * @param readSession - Resolves the Better Auth identity from request headers.
 * @param request - The incoming file request carrying session cookies.
 * @returns The authenticated permanent-account session.
 * @throws {FilesError} When the session is unavailable or lacks access.
 */
const requirePermanentUserFileSession = async (
  readSession: ReadUserFileSessionResult,
  request: Request
): Promise<UserFileSession> => {
  const session = await readSession(request);

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

  return session.value;
};

/**
 * Selects upload authority for the explicit avatar namespace.
 *
 * @param context - The SDK operation and original request.
 * @param userId - The permanent account that owns the upload.
 * @returns Owner-scoped upload authority, or null for another operation.
 */
const authorizeProfileAvatarUpload = (
  context: AuthorizeContext,
  userId: string
): AuthorizeResult | null => {
  if (context.operation !== "upload" || context.key !== undefined) {
    return null;
  }

  if (!isProfileAvatarUploadRequest(context.req)) {
    throw new FilesError("NotFound", "File namespace not found.");
  }

  return {
    keyPrefix: `users/${userId}/${PROFILE_AVATAR_NAMESPACE}/`,
    maxExpiresIn: PROFILE_AVATAR_UPLOAD_EXPIRES_IN_SECONDS,
  };
};

/**
 * Selects read authority for a recognized owner-scoped file key.
 *
 * @param context - The SDK operation and caller-facing key.
 * @param userId - The permanent account that owns the file.
 * @returns Owner-scoped read authority, or null for another operation.
 */
const authorizeUserFileRead = (
  context: AuthorizeContext,
  userId: string
): AuthorizeResult | null => {
  if (
    (context.operation !== "download" && context.operation !== "head") ||
    context.key === undefined
  ) {
    return null;
  }

  const policy = parseUserFileKey(context.key);

  if (policy === null) {
    throw new FilesError("NotFound", "File not found.");
  }

  return {
    disposition: policy.disposition,
    keyPrefix: `users/${userId}/`,
  };
};

/**
 * Constructs per-request authorization for private user files.
 *
 * @param readSession - Resolves the Better Auth identity from request headers.
 * @returns The Files SDK authorization hook that applies explicit policies.
 */
const createUserFileAuthorizer =
  (readSession: ReadUserFileSessionResult): Authorize =>
  async (context: AuthorizeContext) => {
    const session = await requirePermanentUserFileSession(
      readSession,
      context.req
    );
    const upload = authorizeProfileAvatarUpload(context, session.user.id);

    if (upload !== null) {
      return upload;
    }

    const read = authorizeUserFileRead(context, session.user.id);

    if (read !== null) {
      return read;
    }

    throw new FilesError("NotFound", "File not found.");
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
    operations: ["download", "head", "upload"],
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
      const response =
        uploadRejection ??
        (await enforceDirectProfileAvatarUpload(
          request,
          await router.handle(request)
        ));

      return applyPrivateFileResponsePolicy(response);
    },
  };
};

export { createUserFilesRouter };
export type { ReadUserFileSession };
