import {
  redirectErrorCode,
  redirectErrorCodeSchema,
} from "@workspace/better-auth/errors/redirect";

/**
 * Converts a Google OAuth callback failure into safe application-owned copy.
 *
 * @param searchParams - Untrusted sign-in query values returned by Better Auth
 *   or the upstream provider.
 * @returns A recoverable Google sign-in message, or `null` for unrelated input.
 */
const getGoogleSignInErrorMessage = (searchParams: {
  error?: string | string[];
  provider?: string | string[];
}): string | null => {
  if (searchParams.provider !== "google") {
    return null;
  }

  if (searchParams.error === undefined) {
    return null;
  }

  const parsedError = redirectErrorCodeSchema.safeParse(searchParams.error);

  if (!parsedError.success) {
    return "Google sign-in couldn’t be completed. Try again.";
  }

  if (
    parsedError.data ===
      redirectErrorCode.accountAlreadyLinkedToDifferentUser ||
    parsedError.data === redirectErrorCode.accountNotLinked ||
    parsedError.data === redirectErrorCode.emailDoesNotMatch ||
    parsedError.data === redirectErrorCode.unableToLinkAccount
  ) {
    return "That Google account couldn’t be connected. Try another account or continue temporarily.";
  }

  if (
    parsedError.data === redirectErrorCode.emailNotFound ||
    parsedError.data === redirectErrorCode.emailNotVerified
  ) {
    return "Use a Google account with a verified email address.";
  }

  return "Google sign-in couldn’t be completed. Try again.";
};

export { getGoogleSignInErrorMessage };
