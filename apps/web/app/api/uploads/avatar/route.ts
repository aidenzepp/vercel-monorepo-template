import { handleUpload } from "@vercel/blob/client";
import type { HandleUploadBody } from "@vercel/blob/client";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import { z } from "zod";

import { env } from "@/env";
import { auth } from "@/lib/auth/auth-server";
import {
  AVATAR_CONTENT_TYPES,
  createAvatarPathname,
  MAXIMUM_AVATAR_SIZE_IN_BYTES,
} from "@/lib/profile/avatar";

class AvatarUploadAuthorizationError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AvatarUploadAuthorizationError";
    this.status = status;
  }
}

const blobResultSchema = z.strictObject({
  contentDisposition: z.string(),
  contentType: z.string(),
  downloadUrl: z.string(),
  etag: z.string(),
  pathname: z.string(),
  url: z.string(),
});

const handleUploadBodySchema: z.ZodType<HandleUploadBody> =
  z.discriminatedUnion("type", [
    z.strictObject({
      payload: z.strictObject({
        clientPayload: z.string().nullable(),
        multipart: z.boolean(),
        pathname: z.string(),
      }),
      type: z.literal("blob.generate-client-token"),
    }),
    z.strictObject({
      payload: z.strictObject({
        blob: blobResultSchema,
        tokenPayload: z.string().nullish(),
      }),
      type: z.literal("blob.upload-completed"),
    }),
  ]);

const errorResponse = (message: string, status: number): Response =>
  Response.json({ message }, { status });

/** Issues a private, size-bounded upload token for the current user's avatar. */
const POST = async (request: Request): Promise<Response> => {
  const body = await result.trycatch(async () => {
    const value: unknown = await request.json();

    return handleUploadBodySchema.parse(value);
  });

  if (!body.ok) {
    return errorResponse("Send valid avatar upload metadata.", 400);
  }

  const handled = await result.trycatch(
    async () =>
      await handleUpload({
        body: body.value,
        onBeforeGenerateToken: async (pathname) => {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (session === null) {
            throw new AvatarUploadAuthorizationError(
              "Sign in before uploading an avatar.",
              401
            );
          }

          const allowedPathnames = new Set(
            AVATAR_CONTENT_TYPES.map((contentType) =>
              createAvatarPathname(session.user.id, contentType)
            )
          );

          if (!allowedPathnames.has(pathname)) {
            throw new AvatarUploadAuthorizationError(
              "The avatar upload path is invalid.",
              400
            );
          }

          return {
            addRandomSuffix: true,
            allowedContentTypes: [...AVATAR_CONTENT_TYPES],
            maximumSizeInBytes: MAXIMUM_AVATAR_SIZE_IN_BYTES,
          };
        },
        request,
        token: env.BLOB_READ_WRITE_TOKEN,
      })
  );

  if (handled.ok) {
    return Response.json(handled.value);
  }

  if (handled.error instanceof AvatarUploadAuthorizationError) {
    return errorResponse(handled.error.message, handled.error.status);
  }

  logger.error({ err: handled.error }, "Avatar upload authorization failed");

  return errorResponse(
    "The avatar upload could not be prepared. Try again.",
    503
  );
};

export { POST };
