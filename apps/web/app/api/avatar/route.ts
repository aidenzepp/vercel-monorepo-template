import { get } from "@vercel/blob";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";

import { env } from "@/env";
import { auth } from "@/lib/auth/auth-server";
import {
  parseGoogleAvatarUrl,
  parseOwnedPrivateAvatarUrl,
} from "@/lib/profile/avatar";

const GET = async (request: Request): Promise<Response> => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (session === null) {
    return new Response(null, { status: 401 });
  }

  const { image } = session.user;

  if (image === null || image === undefined) {
    return new Response(null, { status: 404 });
  }

  const googleAvatar = parseGoogleAvatarUrl(image);

  if (googleAvatar !== null) {
    return Response.redirect(googleAvatar, 307);
  }

  const privateAvatar = parseOwnedPrivateAvatarUrl(image, session.user.id);

  if (privateAvatar === null) {
    return new Response(null, { status: 404 });
  }

  const avatar = await result.trycatch(
    async () =>
      await get(privateAvatar.toString(), {
        access: "private",
        token: env.BLOB_READ_WRITE_TOKEN,
      })
  );

  if (!avatar.ok) {
    logger.error({ err: avatar.error }, "Private avatar read failed");

    return new Response(null, { status: 502 });
  }

  if (avatar.value === null || avatar.value.statusCode !== 200) {
    return new Response(null, { status: 404 });
  }

  return new Response(avatar.value.stream, {
    headers: {
      "cache-control": "private, no-store",
      "content-type": avatar.value.blob.contentType,
      etag: avatar.value.blob.etag,
      "x-content-type-options": "nosniff",
    },
  });
};

export { GET };
