import { result } from "@workspace/utils/result";
import type {
  FilesClientConfig,
  SendRequest,
  Transport,
} from "files-sdk/client";
import { z } from "zod";

import {
  createProfileAvatarKey,
  PROFILE_AVATAR_UPLOAD_ENDPOINT,
  ProfileAvatarError,
} from "@/lib/files/profile-avatar";

/**
 * The validation reasons the server may safely return to the avatar field.
 */
const profileAvatarValidationReasonSchema = z.enum([
  "filename_type_mismatch",
  "too_large",
  "unsupported_type",
  "wrong_file_count",
]);

/**
 * Parses the safe validation facts returned by the profile-avatar gateway.
 */
const profileAvatarErrorDetailsSchema = z.object({
  acceptedTypes: z.array(z.string()).optional(),
  actualBytes: z.number().optional(),
  actualName: z.string().optional(),
  actualType: z.string().optional(),
  expectedExtension: z.string().optional(),
  maxBytes: z.number().optional(),
});

/**
 * Parses a failed gateway response without accepting provider-specific fields.
 */
const profileAvatarGatewayErrorSchema = z.object({
  error: z.object({
    details: profileAvatarErrorDetailsSchema.optional(),
    message: z.string(),
    reason: profileAvatarValidationReasonSchema.optional(),
  }),
});

/**
 * Parses the two Files SDK JSON operations used by keyless avatar uploads.
 */
const profileAvatarGatewayRequestSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("presign") }),
  z.object({
    completions: z.array(z.object({ key: z.string() })).min(1),
    op: z.literal("complete"),
  }),
]);

/**
 * Confirms that a presign response contains a direct-upload target.
 */
const profileAvatarPresignResponseSchema = z.object({
  uploads: z
    .array(
      z.object({
        id: z.string(),
        key: z.string(),
        target: z.object({ method: z.literal("PUT"), url: z.string() }),
      })
    )
    .min(1),
});

/**
 * Confirms that completion returned at least one verified stored file.
 */
const profileAvatarCompletionResponseSchema = z.object({
  errors: z
    .array(z.object({ key: z.string() }))
    .max(0)
    .optional(),
  files: z.array(z.object({ key: z.string() })).min(1),
});

/**
 * Request context recovered from the Files SDK's JSON operations.
 */
interface ProfileAvatarGatewayContext {
  key?: string;
  phase: "completion" | "presign";
}

/**
 * Dependencies used to decorate the Files SDK client with upload phase errors.
 */
interface CreateProfileAvatarFilesOptions {
  fetchImpl?: typeof fetch;
  transport?: Transport;
}

/**
 * Internal client failure that retains the structured avatar error as its
 * cause.
 */
class ProfileAvatarClientError extends Error {
  /**
   * Wraps a domain error at a Files SDK client boundary.
   *
   * @param cause - The structured failure the profile save must recover.
   */
  constructor(cause: ProfileAvatarError) {
    super(cause.message, { cause });
    this.name = "ProfileAvatarClientError";
  }
}

/**
 * Reads the Files SDK operation and completion key from its JSON body.
 *
 * @param body - The outgoing gateway request body.
 * @returns The avatar upload stage, or null for unrelated requests.
 */
const parseProfileAvatarGatewayContext = (
  body: BodyInit | null | undefined
): ProfileAvatarGatewayContext | null => {
  const encodedBody = z.string().safeParse(body);

  if (!encodedBody.success) {
    return null;
  }

  const parsed = result.trycatch(() => {
    const json: unknown = JSON.parse(encodedBody.data);
    return profileAvatarGatewayRequestSchema.parse(json);
  });

  if (!parsed.ok) {
    return null;
  }

  if (parsed.value.op === "presign") {
    return { phase: "presign" };
  }

  const completion = parsed.value.completions.at(0);

  return completion === undefined
    ? null
    : {
        key: createProfileAvatarKey(completion.key),
        phase: "completion",
      };
};

/**
 * Creates a phase-aware error and retains a completion key when available.
 *
 * @param context - The Files SDK operation represented by the request.
 * @param message - The user-safe error summary.
 * @param code - The form's repair category.
 * @param storageState - What is known about stored image bytes.
 * @param cause - Optional operator-facing root cause.
 * @returns A structured avatar error.
 */
const createGatewayError = (
  context: ProfileAvatarGatewayContext,
  message: string,
  code: "session_expired" | "upload_unavailable" | "upload_unconfirmed",
  storageState: "not_uploaded" | "unknown",
  cause?: unknown
): ProfileAvatarError => {
  const error = new ProfileAvatarError(message, {
    cause,
    code,
    phase: context.phase,
    retryable: true,
    storageState,
  });

  if (context.key === undefined) {
    return error;
  }

  return new ProfileAvatarError(message, {
    cause,
    code,
    pendingKey: context.key,
    phase: context.phase,
    retryable: true,
    storageState,
  });
};

/**
 * Parses a safe server validation error from a failed gateway response.
 *
 * @param response - The non-successful gateway response to inspect.
 * @returns The server-owned validation error, or null for another failure.
 */
const readGatewayValidationError = async (
  response: Response
): Promise<ProfileAvatarError | null> => {
  const parsed = await result.trycatch(async () => {
    const json: unknown = await response.clone().json();
    return profileAvatarGatewayErrorSchema.parse(json);
  });

  if (!parsed.ok || parsed.value.error.reason === undefined) {
    return null;
  }

  return new ProfileAvatarError(parsed.value.error.message, {
    code: parsed.value.error.reason,
    details: parsed.value.error.details,
    phase: "validation",
    retryable: false,
    storageState: "not_uploaded",
  });
};

/**
 * Maps a failed gateway response to validation, session, or provider state.
 *
 * @param context - The avatar operation represented by the request.
 * @param response - The non-successful gateway response.
 * @returns The structured failure to preserve through Files SDK.
 */
const getFailedGatewayError = async (
  context: ProfileAvatarGatewayContext,
  response: Response
): Promise<ProfileAvatarError> => {
  const validationError = await readGatewayValidationError(response);

  if (validationError !== null) {
    return validationError;
  }

  if (response.status === 401 || response.status === 403) {
    return createGatewayError(
      context,
      "Your session expired.",
      "session_expired",
      context.phase === "presign" ? "not_uploaded" : "unknown"
    );
  }

  return context.phase === "presign"
    ? createGatewayError(
        context,
        "Image uploads are temporarily unavailable.",
        "upload_unavailable",
        "not_uploaded"
      )
    : createGatewayError(
        context,
        "We couldn’t confirm whether the image finished uploading.",
        "upload_unconfirmed",
        "unknown"
      );
};

/**
 * Confirms that a successful gateway response satisfies its operation contract.
 *
 * @param context - The avatar operation represented by the request.
 * @param response - The successful gateway response to validate.
 * @returns True when the response is incomplete or malformed.
 */
const isGatewayResponseInvalid = async (
  context: ProfileAvatarGatewayContext,
  response: Response
): Promise<boolean> => {
  if (context.phase === "presign") {
    const parsed = await result.trycatch(async () => {
      const json: unknown = await response.clone().json();
      return profileAvatarPresignResponseSchema.parse(json);
    });
    return !parsed.ok;
  }

  const parsed = await result.trycatch(async () => {
    const json: unknown = await response.clone().json();
    return profileAvatarCompletionResponseSchema.parse(json);
  });
  return !parsed.ok;
};

/**
 * Converts a malformed successful response into the correct phase failure.
 *
 * @param context - The avatar operation represented by the request.
 * @returns A structured provider or completion error.
 */
const getInvalidGatewayResponseError = (
  context: ProfileAvatarGatewayContext
): ProfileAvatarError =>
  context.phase === "presign"
    ? createGatewayError(
        context,
        "Image uploads are temporarily unavailable.",
        "upload_unavailable",
        "not_uploaded"
      )
    : createGatewayError(
        context,
        "We couldn’t confirm whether the image finished uploading.",
        "upload_unconfirmed",
        "unknown"
      );

/**
 * Decorates Files SDK JSON requests with phase-aware avatar failures.
 *
 * @param fetchImpl - The underlying browser fetch implementation.
 * @returns A fetch implementation that preserves presign and completion state.
 */
const createProfileAvatarGatewayFetch = (
  fetchImpl: typeof fetch
): typeof fetch => {
  /**
   * Sends one gateway request and retains the operation when it fails.
   *
   * @param input - The gateway request URL or Request object.
   * @param init - The Files SDK request method, headers, body, and signal.
   * @returns The validated response consumed by Files SDK.
   */
  const avatarFetch: typeof fetch = async (input, init) => {
    const context = parseProfileAvatarGatewayContext(init?.body);
    const response = await result.trycatch(
      async () => await fetchImpl(input, init)
    );

    if (!response.ok) {
      if (context === null) {
        throw response.error;
      }

      throw new ProfileAvatarClientError(
        createGatewayError(
          context,
          context.phase === "presign"
            ? "Image uploads are temporarily unavailable."
            : "We couldn’t confirm whether the image finished uploading.",
          context.phase === "presign"
            ? "upload_unavailable"
            : "upload_unconfirmed",
          context.phase === "presign" ? "not_uploaded" : "unknown",
          response.error
        )
      );
    }

    if (context === null) {
      return response.value;
    }

    if (!response.value.ok) {
      throw new ProfileAvatarClientError(
        await getFailedGatewayError(context, response.value)
      );
    }

    if (await isGatewayResponseInvalid(context, response.value)) {
      throw new ProfileAvatarClientError(
        getInvalidGatewayResponseError(context)
      );
    }

    return response.value;
  };

  avatarFetch.preconnect = fetchImpl.preconnect;
  return avatarFetch;
};

/**
 * Determines whether the SDK selected its application-proxy fallback target.
 *
 * @param target - The target URL returned by the upload gateway.
 * @returns True when bytes would be sent back through `/api/files`.
 */
const isApplicationProxyTarget = (target: string): boolean => {
  const parsed = result.trycatch(() =>
    new URL(target, "http://localhost").searchParams.get("op")
  );
  return parsed.ok && parsed.value === "proxy";
};

/**
 * Decorates direct storage transfer with explicit uncertainty semantics.
 *
 * @param transport - The underlying signed-target upload transport.
 * @returns A transport that rejects application fallback and normalizes errors.
 */
const createProfileAvatarTransport =
  (transport: Transport): Transport =>
  async (request: SendRequest) => {
    if (isApplicationProxyTarget(request.url)) {
      throw new ProfileAvatarClientError(
        new ProfileAvatarError("Image uploads are temporarily unavailable.", {
          code: "upload_unavailable",
          phase: "presign",
          retryable: true,
          storageState: "not_uploaded",
        })
      );
    }

    const sent = await result.trycatch(async () => await transport(request));

    if (!sent.ok) {
      throw new ProfileAvatarClientError(
        new ProfileAvatarError(
          "We couldn’t confirm whether the image reached storage.",
          {
            cause: sent.error,
            code: "upload_unconfirmed",
            phase: "transfer",
            retryable: true,
            storageState: "unknown",
          }
        )
      );
    }

    if (sent.value.status < 200 || sent.value.status >= 300) {
      throw new ProfileAvatarClientError(
        new ProfileAvatarError(
          "We couldn’t confirm whether the image reached storage.",
          {
            cause: new Error(
              `Direct storage upload returned status ${sent.value.status}.`
            ),
            code: "upload_unconfirmed",
            phase: "transfer",
            retryable: true,
            storageState: "unknown",
          }
        )
      );
    }

    return sent.value;
  };

/**
 * Sends avatar bytes to the Vercel Blob signed PUT target.
 *
 * @param fetchImpl - The browser fetch implementation used for the signed URL.
 * @returns A Files SDK transport for the avatar service's PUT-only contract.
 */
const createProfileAvatarDirectTransport =
  (fetchImpl: typeof fetch): Transport =>
  async (request: SendRequest) => {
    if (request.method !== "PUT" || !(request.body instanceof Blob)) {
      throw new Error("The avatar upload target was not a signed Blob PUT.");
    }

    request.onProgress?.(0, request.body.size);
    const response = await fetchImpl(request.url, {
      body: request.body,
      headers: request.headers,
      method: request.method,
      signal: request.signal,
    });
    request.onProgress?.(request.body.size, request.body.size);

    return { status: response.status, text: await response.text() };
  };

/**
 * Creates Files SDK options that retain avatar upload phase and storage state.
 *
 * @param dependencies - Optional browser seams used by the app and tests.
 * @param dependencies.fetchImpl - Sends JSON gateway operations.
 * @param dependencies.transport - Sends bytes to the signed storage target.
 * @returns Stable client configuration for the avatar namespace.
 */
const createProfileAvatarFilesOptions = (
  dependencies: CreateProfileAvatarFilesOptions = {}
): FilesClientConfig => {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const transport =
    dependencies.transport ?? createProfileAvatarDirectTransport(fetchImpl);

  return {
    endpoint: PROFILE_AVATAR_UPLOAD_ENDPOINT,
    fetchImpl: createProfileAvatarGatewayFetch(fetchImpl),
    transport: createProfileAvatarTransport(transport),
  };
};

export { createProfileAvatarFilesOptions };
