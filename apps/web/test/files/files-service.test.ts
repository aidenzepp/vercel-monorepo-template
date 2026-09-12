import {
  afterAll,
  beforeEach,
  describe,
  expect,
  mock,
  setSystemTime,
  test,
} from "bun:test";

import type {
  IssueSignedTokenOptions,
  IssuedSignedToken,
  PresignUrlOptions,
} from "@vercel/blob";

/**
 * Stable clock used to verify relative Files SDK lifetimes.
 */
const NOW = new Date("2026-09-11T12:00:00.000Z");

/**
 * Delegation returned by the mocked Vercel control plane.
 */
const SIGNED_TOKEN: IssuedSignedToken = {
  clientSigningToken: "client-signing-token",
  delegationToken: "delegation-token",
  validUntil: NOW.getTime() + 60_000,
};

/**
 * Records the delegation constraints requested by the file service.
 */
const issueSignedToken = mock(
  (options: IssueSignedTokenOptions): IssuedSignedToken => ({
    ...SIGNED_TOKEN,
    validUntil: options.validUntil ?? SIGNED_TOKEN.validUntil,
  })
);

/**
 * Records the concrete URL constraints requested by the file service.
 */
const presignUrl = mock(
  (
    _token: Pick<IssuedSignedToken, "clientSigningToken" | "delegationToken">,
    _options: PresignUrlOptions & { access: "private" | "public" }
  ) => ({ presignedUrl: "https://blob.example/signed" })
);

await mock.module("server-only", () => ({}));
await mock.module("@vercel/blob", () => ({ issueSignedToken, presignUrl }));

/**
 * Credential state restored after the adapter's eager configuration check.
 */
const ORIGINAL_BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

process.env.BLOB_READ_WRITE_TOKEN = "test-read-write-token";

/**
 * File service loaded after its server-only and provider dependencies are
 * mocked.
 */
const { FileService, fileService } =
  await import("../../lib/files/files-service");

beforeEach(() => {
  setSystemTime(NOW);
  issueSignedToken.mockClear();
  presignUrl.mockClear();
});

afterAll(() => {
  setSystemTime();
  process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_BLOB_READ_WRITE_TOKEN;
});

describe("FileService", () => {
  test("mints a constrained direct-upload contract", async () => {
    const signal = AbortSignal.timeout(1000);
    const upload = await fileService.signedUploadUrl(
      "users/user_123/files/file_123",
      {
        contentType: "image/png",
        expiresIn: 60,
        maxSize: 5_000_000,
        minSize: 0,
        signal,
      }
    );

    expect(upload).toEqual({
      headers: { "Content-Type": "image/png" },
      method: "PUT",
      url: "https://blob.example/signed",
    });
    expect(issueSignedToken).toHaveBeenCalledWith({
      abortSignal: signal,
      allowedContentTypes: ["image/png"],
      maximumSizeInBytes: 5_000_000,
      operations: ["put"],
      pathname: "users/user_123/files/file_123",
      validUntil: NOW.getTime() + 60_000,
    });
    expect(presignUrl).toHaveBeenCalledWith(SIGNED_TOKEN, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      allowedContentTypes: ["image/png"],
      maximumSizeInBytes: 5_000_000,
      operation: "put",
      pathname: "users/user_123/files/file_123",
      validUntil: NOW.getTime() + 60_000,
    });
  });

  test("forwards explicit OIDC credentials to signed downloads", async () => {
    const signal = AbortSignal.timeout(1000);
    const files = new FileService({
      access: "private",
      oidcToken: "oidc-token",
      storeId: "store_123",
    });
    const url = await files.url("documents/report.pdf", {
      expiresIn: 120,
      signal,
    });

    expect(url).toBe("https://blob.example/signed");
    expect(issueSignedToken).toHaveBeenCalledWith({
      abortSignal: signal,
      oidcToken: "oidc-token",
      operations: ["get"],
      pathname: "documents/report.pdf",
      storeId: "store_123",
      validUntil: NOW.getTime() + 120_000,
    });
    expect(presignUrl).toHaveBeenCalledWith(
      {
        ...SIGNED_TOKEN,
        validUntil: NOW.getTime() + 120_000,
      },
      {
        access: "private",
        operation: "get",
        pathname: "documents/report.pdf",
        validUntil: NOW.getTime() + 120_000,
      }
    );
  });

  test("rejects signed-upload constraints Vercel cannot enforce", () => {
    const upload = fileService.signedUploadUrl("empty.txt", {
      expiresIn: 60,
      minSize: 1,
    });

    expect(upload).rejects.toMatchObject({
      code: "Provider",
      message:
        "vercel-blob: signedUploadUrl() cannot enforce minSize; omit it or pass 0.",
      permanent: true,
    });
    expect(issueSignedToken).not.toHaveBeenCalled();
  });

  test("rejects download dispositions Vercel cannot enforce", () => {
    const download = fileService.url("document.html", {
      responseContentDisposition: "attachment",
    });

    expect(download).rejects.toMatchObject({
      code: "Provider",
      message: "vercel-blob: url() cannot override Content-Disposition.",
      permanent: true,
    });
    expect(issueSignedToken).not.toHaveBeenCalled();
  });
});
