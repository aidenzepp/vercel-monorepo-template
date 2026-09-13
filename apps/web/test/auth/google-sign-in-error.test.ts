import { expect, test } from "bun:test";

import { redirectErrorCode } from "@workspace/better-auth/errors/redirect";

import { getGoogleSignInErrorMessage } from "../../lib/auth/google-sign-in-error";

test("ignores callback state that is not for Google", () => {
  expect(getGoogleSignInErrorMessage({})).toBeNull();
  expect(
    getGoogleSignInErrorMessage({
      error: redirectErrorCode.stateMismatch,
      provider: "github",
    })
  ).toBeNull();
});

test("explains Google account connection failures", () => {
  expect(
    getGoogleSignInErrorMessage({
      error: redirectErrorCode.accountAlreadyLinkedToDifferentUser,
      provider: "google",
    })
  ).toBe(
    "That Google account couldn’t be connected. Try another account or continue temporarily."
  );
});

test("explains unusable Google email identities", () => {
  expect(
    getGoogleSignInErrorMessage({
      error: redirectErrorCode.emailNotVerified,
      provider: "google",
    })
  ).toBe("Use a Google account with a verified email address.");
});

test("uses safe generic copy for operational and provider errors", () => {
  expect(
    getGoogleSignInErrorMessage({
      error: redirectErrorCode.stateMismatch,
      provider: "google",
    })
  ).toBe("Google sign-in couldn’t be completed. Try again.");
  expect(
    getGoogleSignInErrorMessage({
      error: "access_denied",
      provider: "google",
    })
  ).toBe("Google sign-in couldn’t be completed. Try again.");
  expect(
    getGoogleSignInErrorMessage({
      error: [redirectErrorCode.stateMismatch],
      provider: "google",
    })
  ).toBe("Google sign-in couldn’t be completed. Try again.");
});
