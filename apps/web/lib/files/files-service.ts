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
    async signedUploadUrl(
      key: string,
      upload: SignUploadOptions
    ): Promise<SignedUpload> {
      if (upload.minSize !== undefined && upload.minSize > 0) {
        throw new FilesError(
          "Provider",
          "vercel-blob: signedUploadUrl() cannot enforce minSize; omit it or pass 0.",
          undefined,
          { permanent: true }
        );
      }

      const validUntil = expiresAt(upload.expiresIn);
      const allowedContentTypes =
        upload.contentType === undefined ? undefined : [upload.contentType];
      const token = await issueSignedToken({
        ...credentials,
        abortSignal: upload.signal,
        allowedContentTypes,
        maximumSizeInBytes: upload.maxSize,
        operations: ["put"],
        pathname: key,
        validUntil,
      });
      const signed = await presignUrl(token, {
        access,
        addRandomSuffix: false,
        allowOverwrite: false,
        allowedContentTypes,
        maximumSizeInBytes: upload.maxSize,
        operation: "put",
        pathname: key,
        validUntil: token.validUntil,
      });

      return {
        headers:
          upload.contentType === undefined
            ? undefined
            : { "Content-Type": upload.contentType },
        method: "PUT",
        url: signed.presignedUrl,
      };
    },
    signedUrl: { supported: true },
    async url(key: string, request?: UrlOptions): Promise<string> {
      if (request?.responseContentDisposition !== undefined) {
        throw new FilesError(
          "Provider",
          "vercel-blob: url() cannot override Content-Disposition.",
          undefined,
          { permanent: true }
        );
      }

      const validUntil = expiresAt(request?.expiresIn);
      const token = await issueSignedToken({
        ...credentials,
        abortSignal: request?.signal,
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
    },
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
const fileService = new FileService({
  access: "private",
});

export { FileService, fileService };
export type { FileServiceOptions };
