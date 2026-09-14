import { afterEach, expect, mock, spyOn, test } from "bun:test";

import { logger } from "@workspace/utils/logger";

import { requestGoogleSignIn } from "../../lib/auth/google-sign-in";

afterEach(() => {
  mock.restore();
});

test("starts one Google OAuth request with fixed callbacks", async () => {
  const requests: unknown[] = [];

  const errorMessage = await requestGoogleSignIn(async (options) => {
    requests.push(options);
    return await Promise.resolve({ error: null });
  });

  expect(errorMessage).toBeNull();
  expect(requests).toEqual([
    {
      callbackURL: "/",
      errorCallbackURL: "/sign-in?provider=google",
      provider: "google",
    },
  ]);
});

test("reports a rejected Google sign-in request", async () => {
  const errorLog = spyOn(logger, "error").mockImplementation(() => {});

  const errorMessage = await requestGoogleSignIn(
    async () => await Promise.reject(new Error("network unavailable"))
  );

  expect(errorMessage).toBe("Google sign-in couldn’t be opened. Try again.");
  expect(errorLog).toHaveBeenCalledWith(
    { operation: "auth.sign_in.google.request" },
    "Google sign-in request failed before Better Auth responded"
  );
});

test("reports a Better Auth Google response error", async () => {
  const warningLog = spyOn(logger, "warn").mockImplementation(() => {});

  const errorMessage = await requestGoogleSignIn(
    async () =>
      await Promise.resolve({ error: { code: "BAD_REQUEST", status: 400 } })
  );

  expect(errorMessage).toBe("templ8 couldn’t start Google sign-in. Try again.");
  expect(warningLog).toHaveBeenCalledWith(
    { operation: "auth.sign_in.google.response" },
    "Better Auth rejected the Google sign-in request"
  );
});
