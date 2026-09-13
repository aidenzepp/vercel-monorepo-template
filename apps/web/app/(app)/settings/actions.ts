"use server";

import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";

import { requireSession } from "@/lib/auth/session-server";
import { files } from "@/lib/files/files-service";
import { uploadProfileAvatarFile } from "@/lib/files/profile-avatar";
import type { ProfileAvatarUploadResult } from "@/lib/files/profile-avatar";

/**
 * Uploads the current user's selected profile avatar.
 *
 * @param formData - The multipart profile data containing an avatar image.
 * @returns The uploaded avatar URL or repair guidance for the form.
 */
const uploadProfileAvatar = async (
  formData: FormData
): Promise<ProfileAvatarUploadResult> => {
  const { user } = await requireSession();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return { message: "Choose an image to upload.", ok: false };
  }

  const uploaded = await result.trycatch(
    async () => await uploadProfileAvatarFile({ file, files, userId: user.id })
  );

  if (!uploaded.ok) {
    logger.error(
      {
        err: uploaded.error,
        operation: "profile.avatar.upload",
        userId: user.id,
      },
      "Profile avatar upload failed"
    );
    return {
      message: "We couldn’t upload that image. Try again.",
      ok: false,
    };
  }

  return uploaded.value;
};

export { uploadProfileAvatar };
