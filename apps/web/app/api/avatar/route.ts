import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";

import { auth } from "@/lib/auth/auth-server";
import { fileService } from "@/lib/files/files-service";
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
    async () => await fileService.url(privateAvatar.pathname.slice(1))
  );

  if (!avatar.ok) {
    logger.error({ err: avatar.error }, "Private avatar read failed");

    return new Response(null, { status: 502 });
  }

  return Response.redirect(avatar.value, 307);
};

export { GET };
