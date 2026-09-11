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

import { env } from "@/env";

type FileServiceOptions = Omit<VercelBlobAdapterOptions, "addRandomSuffix">;

type BlobCredentials = Pick<
  IssueSignedTokenOptions,
  "oidcToken" | "storeId" | "token"
>;

const DEFAULT_URL_LIFETIME_IN_SECONDS = 5 * 60;

/** Returns only the credentials understood by Vercel's signing functions. */
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

const expiresAt = (expiresIn?: number): number =>
  Date.now() + (expiresIn ?? DEFAULT_URL_LIFETIME_IN_SECONDS) * 1000;

/**
 * Adds Vercel's current signed URL primitives to the Files SDK adapter.
 *
 * The upstream adapter predates `issueSignedToken()` and `presignUrl()`. This
 * adapter preserves its storage behavior while supplying signed private reads
 * and direct client uploads through the standard Files interface.
 */
const signedVercelBlob = (options: FileServiceOptions): VercelBlobAdapter => {
  const access = options.access ?? "public";
  const credentials = getBlobCredentials(options);
  const adapter = vercelBlob({
    ...options,
    addRandomSuffix: false,
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
          "Vercel Blob cannot enforce a minimum size on a signed upload.",
          undefined,
          { permanent: true }
        );
      }

      const validUntil = expiresAt(upload.expiresIn);
      const allowedContentTypes =
        upload.contentType === undefined ? undefined : [upload.contentType];
      const token = await issueSignedToken({
        ...credentials,
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
          "Vercel Blob signed URLs cannot override Content-Disposition.",
          undefined,
          { permanent: true }
        );
      }

      const validUntil = expiresAt(request?.expiresIn);
      const token = await issueSignedToken({
        ...credentials,
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

/** Vercel Blob-backed implementation of the provider-neutral Files API. */
class FileService extends Files<VercelBlobAdapter> {
  constructor(options: FileServiceOptions = {}) {
    super({ adapter: signedVercelBlob(options) });
  }
}

const fileService = new FileService({
  access: "private",
  token: env.BLOB_READ_WRITE_TOKEN,
});

export { FileService, fileService };
export type { FileServiceOptions };
