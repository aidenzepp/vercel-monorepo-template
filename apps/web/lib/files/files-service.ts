import "server-only";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import type { IssueSignedTokenOptions } from "@vercel/blob";
import { Files, FilesError } from "files-sdk";
import type { SignUploadOptions, SignedUpload, UrlOptions } from "files-sdk";
import { vercelBlob } from "files-sdk/vercel-blob";
import type {
  VercelBlobAdapter,
  VercelBlobAdapterOptions,
} from "files-sdk/vercel-blob";

/**
 * Vercel Blob configuration callers may supply without changing the service's
 * deterministic, create-only object-key policy.
 */
type FileServiceOptions = Omit<
  VercelBlobAdapterOptions,
  "addRandomSuffix" | "allowOverwrite"
>;

/**
 * The access mode shared by Vercel's delegation and presigning operations.
 */
type BlobAccess = NonNullable<VercelBlobAdapterOptions["access"]>;

/**
 * Credentials forwarded to Vercel Blob signing operations.
 */
type BlobCredentials = Pick<
  IssueSignedTokenOptions,
  "oidcToken" | "storeId" | "token"
>;

/**
 * Default lifetime for signed upload and download URLs.
 */
const DEFAULT_URL_LIFETIME_IN_SECONDS = 5 * 60;

/**
 * Returns only the optional credentials understood by Vercel's signing
 * functions.
 *
 * An empty result preserves the Blob SDK's per-operation credential lookup:
 * Vercel OIDC first, then the local read-write token fallback.
 *
 * @param options - The adapter options that may contain provider credentials.
 * @returns Only the credential fields accepted by the signing SDK.
 * @see https://vercel.com/docs/oidc
 */
const getBlobCredentials = (options: FileServiceOptions): BlobCredentials => {
  const credentials: BlobCredentials = {};

  if (options.token !== undefined) {
    credentials.token = options.token;
  }
  if (options.oidcToken !== undefined) {
    credentials.oidcToken = options.oidcToken;
  }
  if (options.storeId !== undefined) {
    credentials.storeId = options.storeId;
  }

  return credentials;
};

/**
 * Converts a relative lifetime into the absolute timestamp Vercel expects.
 *
 * @param expiresIn - Optional lifetime in seconds.
 * @returns The expiration timestamp in milliseconds.
 */
const expiresAt = (expiresIn?: number): number =>
  Date.now() + (expiresIn ?? DEFAULT_URL_LIFETIME_IN_SECONDS) * 1000;

/**
 * Rejects signed-upload constraints that Vercel Blob cannot enforce.
 *
 * @param options - The Files SDK constraints requested for one direct upload.
 * @throws {FilesError} When the caller requires a positive minimum file size.
 */
const assertSignedUploadSupported = (options: SignUploadOptions): void => {
  if (options.minSize !== undefined && options.minSize > 0) {
    throw new FilesError(
      "Provider",
      "vercel-blob: signedUploadUrl() cannot enforce minSize; omit it or pass 0.",
      undefined,
      { permanent: true }
    );
  }
};

/**
 * Rejects download URL behavior that Vercel Blob cannot sign.
 *
 * @param options - The Files SDK options requested for one download URL.
 * @throws {FilesError} When the caller requires a Content-Disposition override.
 */
const assertUrlSupported = (options?: UrlOptions): void => {
  if (options?.responseContentDisposition !== undefined) {
    throw new FilesError(
      "Provider",
      "vercel-blob: url() cannot override Content-Disposition.",
      undefined,
      { permanent: true }
    );
  }
};

/**
 * Mints the Files SDK contract for a browser-direct Vercel Blob upload.
 *
 * @param access - The access mode assigned to the uploaded Blob.
 * @param credentials - Optional provider credentials that override environment
 *   lookup.
 * @param key - The exact caller-owned object key to authorize.
 * @param options - The lifetime and constraints bound to the upload capability.
 * @returns The signed PUT request the browser can send directly to Vercel Blob.
 * @throws {FilesError} When the requested constraints cannot be enforced.
 * @see https://files-sdk.dev/docs/api/signed-upload-url
 */
const signedUploadUrl = async (
  access: BlobAccess,
  credentials: BlobCredentials,
  key: string,
  options: SignUploadOptions
): Promise<SignedUpload> => {
  assertSignedUploadSupported(options);

  const validUntil = expiresAt(options.expiresIn);
  const allowedContentTypes =
    options.contentType === undefined ? undefined : [options.contentType];
  const token = await issueSignedToken({
    ...credentials,
    abortSignal: options.signal,
    allowedContentTypes,
    maximumSizeInBytes: options.maxSize,
    operations: ["put"],
    pathname: key,
    validUntil,
  });
  const signed = await presignUrl(token, {
    access,
    addRandomSuffix: false,
    allowOverwrite: false,
    allowedContentTypes,
    maximumSizeInBytes: options.maxSize,
    operation: "put",
    pathname: key,
    validUntil: token.validUntil,
  });

  return {
    headers:
      options.contentType === undefined
        ? undefined
        : { "Content-Type": options.contentType },
    method: "PUT",
    url: signed.presignedUrl,
  };
};

/**
 * Mints a temporary URL for reading one Vercel Blob object.
 *
 * @param access - The access mode of the stored Blob.
 * @param credentials - Optional provider credentials that override environment
 *   lookup.
 * @param key - The exact caller-owned object key to authorize.
 * @param options - Optional Files SDK lifetime and cancellation controls.
 * @returns A temporary URL authorized to read only the requested object.
 * @throws {FilesError} When the requested response behavior cannot be enforced.
 */
const url = async (
  access: BlobAccess,
  credentials: BlobCredentials,
  key: string,
  options?: UrlOptions
): Promise<string> => {
  assertUrlSupported(options);

  const validUntil = expiresAt(options?.expiresIn);
  const token = await issueSignedToken({
    ...credentials,
    abortSignal: options?.signal,
    operations: ["get"],
    pathname: key,
    validUntil,
  });
  const signed = await presignUrl(token, {
    access,
    operation: "get",
    pathname: key,
    validUntil: token.validUntil,
  });

  return signed.presignedUrl;
};

/**
 * Adds Vercel's current signed URL primitives to the Files SDK adapter.
 *
 * The upstream adapter predates `issueSignedToken()` and `presignUrl()`. This
 * adapter preserves its storage behavior while supplying signed private reads
 * and direct client uploads through the standard Files interface.
 *
 * @param options - Storage, access, and credential options for the adapter.
 * @returns A Vercel Blob adapter with signed upload and download support.
 */
const signedVercelBlob = (options: FileServiceOptions): VercelBlobAdapter => {
  const access = options.access ?? "public";
  const credentials = getBlobCredentials(options);
  const adapter = vercelBlob({
    ...options,
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  return {
    ...adapter,
    signedUploadUrl: async (key, uploadOptions) =>
      await signedUploadUrl(access, credentials, key, uploadOptions),
    signedUrl: { supported: true },
    url: async (key, urlOptions) =>
      await url(access, credentials, key, urlOptions),
  };
};

/**
 * Vercel Blob-backed implementation of the provider-neutral Files API.
 */
class FileService extends Files<VercelBlobAdapter> {
  /**
   * Constructs a provider-neutral file client backed by Vercel Blob.
   *
   * Object keys remain caller-owned and create-only. When credentials are
   * omitted, the Blob SDK resolves auto-rotating Vercel OIDC credentials per
   * operation before falling back to `BLOB_READ_WRITE_TOKEN`.
   *
   * @param options - Optional Vercel Blob access and credential overrides.
   * @see https://files-sdk.dev/docs/adapters/vercel-blob
   */
  constructor(options: FileServiceOptions = {}) {
    super({ adapter: signedVercelBlob(options) });
  }
}

/**
 * Application FileService configured for the private Vercel Blob store.
 */
const files = new FileService({
  access: "private",
});

export { FileService, files };
export type { FileServiceOptions };
