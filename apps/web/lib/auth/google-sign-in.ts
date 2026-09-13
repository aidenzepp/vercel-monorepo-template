"use client";

import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";

/**
 * The Better Auth social operation used to start the fixed Google OAuth flow.
 */
type GoogleSignInRequest = (options: {
  callbackURL: "/";
  errorCallbackURL: "/sign-in?provider=google";
  provider: "google";
}) => Promise<{
  error: { code?: string; status?: number } | null;
}>;

/**
 * Requests a Google OAuth redirect and reports failures that occur before the
 * browser leaves the sign-in page.
 *
 * @param signInSocial - Better Auth's social sign-in operation.
 * @returns A recoverable failure message, or `null` after a successful start.
 * @see https://www.better-auth.com/docs/authentication/social-sign-in
 */
const requestGoogleSignIn = async (
  signInSocial: GoogleSignInRequest
): Promise<string | null> => {
  const response = await result.trycatch(
    async () =>
      await signInSocial({
        callbackURL: "/",
        errorCallbackURL: "/sign-in?provider=google",
        provider: "google",
      })
  );

  if (!response.ok) {
    logger.error(
      { err: response.error, operation: "auth.sign_in.google.request" },
      "Google sign-in request failed before Better Auth responded"
    );
    return "Google sign-in couldn’t be opened. Try again.";
  }

  if (response.value.error !== null) {
    logger.warn(
      {
        code: response.value.error.code,
        operation: "auth.sign_in.google.response",
        status: response.value.error.status,
      },
      "Better Auth rejected the Google sign-in request"
    );
    return "templ8 couldn’t start Google sign-in. Try again.";
  }

  return null;
};

export { requestGoogleSignIn };
