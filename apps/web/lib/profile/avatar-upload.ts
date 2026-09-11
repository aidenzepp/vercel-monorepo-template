"use server";

import { FilesError } from "files-sdk";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session-server";
import { fileService } from "@/lib/files/files-service";
import {
  avatarContentTypeSchema,
  createAvatarPathname,
  MAXIMUM_AVATAR_SIZE_IN_BYTES,
  parseOwnedPrivateAvatarUrl,
} from "@/lib/profile/avatar";

const avatarUploadRequestSchema = z.object({
  contentType: avatarContentTypeSchema,
  size: z.number().int().positive().max(MAXIMUM_AVATAR_SIZE_IN_BYTES),
});

type AvatarUploadRequest = z.input<typeof avatarUploadRequestSchema>;

interface PreparedAvatarUpload {
  headers: Record<string, string>;
  signedUploadUrl: string;
}

/** Confirms that a completed upload is an owned avatar with valid metadata. */
const completeAvatarUpload = async (url: string): Promise<string> => {
  const session = await requireSession();
  const avatarUrl = parseOwnedPrivateAvatarUrl(url, session.user.id);

  if (avatarUrl === null) {
    throw new FilesError(
      "Unauthorized",
      "The uploaded avatar does not belong to the current user.",
      undefined,
      { permanent: true }
    );
  }

  const avatar = await fileService.head(avatarUrl.pathname.slice(1));
  const contentType = avatarContentTypeSchema.safeParse(avatar.type);
  const hasValidSize =
    avatar.size > 0 && avatar.size <= MAXIMUM_AVATAR_SIZE_IN_BYTES;

  if (!contentType.success || !hasValidSize) {
    throw new FilesError(
      "Provider",
      "The uploaded avatar has invalid metadata.",
      undefined,
      { permanent: true }
    );
  }

  return avatarUrl.toString();
};

/** Authorizes one short-lived, size-bound upload for the current user. */
const prepareAvatarUpload = async (
  input: AvatarUploadRequest
): Promise<PreparedAvatarUpload> => {
  const session = await requireSession();
  const avatar = avatarUploadRequestSchema.parse(input);
  const pathname = createAvatarPathname(
    session.user.id,
    avatar.contentType,
    crypto.randomUUID()
  );
  const target = await fileService.signedUploadUrl(pathname, {
    contentType: avatar.contentType,
    expiresIn: 5 * 60,
    maxSize: MAXIMUM_AVATAR_SIZE_IN_BYTES,
  });

  if (target.method !== "PUT") {
    throw new FilesError(
      "Provider",
      "Vercel Blob returned an unsupported upload method.",
      undefined,
      { permanent: true }
    );
  }

  return {
    headers: target.headers ?? {},
    signedUploadUrl: target.url,
  };
};

export { completeAvatarUpload, prepareAvatarUpload };
export type { AvatarUploadRequest, PreparedAvatarUpload };
