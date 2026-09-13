import { afterEach, expect, test } from "bun:test";

import { google } from "../../src/config/google.js";

/**
 * Captures the original client ID so each test can restore the process
 * environment.
 */
const ORIGINAL_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/**
 * Captures the original client secret so each test can restore the process
 * environment.
 */
const ORIGINAL_GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Asserts invalid Google credentials while hiding T3 Env's expected diagnostic.
 *
 * @returns Completes after the invalid preset assertion and console
 *   restoration.
 */
const expectInvalidGoogleEnvironment = () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    expect(() => google()).toThrow();
  } finally {
    console.error = originalConsoleError;
  }
};

afterEach(() => {
  if (ORIGINAL_GOOGLE_CLIENT_ID === undefined) {
    delete process.env.GOOGLE_CLIENT_ID;
  } else {
    process.env.GOOGLE_CLIENT_ID = ORIGINAL_GOOGLE_CLIENT_ID;
  }

  if (ORIGINAL_GOOGLE_CLIENT_SECRET === undefined) {
    delete process.env.GOOGLE_CLIENT_SECRET;
  } else {
    process.env.GOOGLE_CLIENT_SECRET = ORIGINAL_GOOGLE_CLIENT_SECRET;
  }
});

test("validates Google OAuth client credentials", () => {
  process.env.GOOGLE_CLIENT_ID = "google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";

  const env = google();

  expect(env.GOOGLE_CLIENT_ID).toBe("google-client-id");
  expect(env.GOOGLE_CLIENT_SECRET).toBe("google-client-secret");
});

test("rejects a missing Google OAuth client ID", () => {
  delete process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";

  expectInvalidGoogleEnvironment();
});

test("rejects an empty Google OAuth client ID", () => {
  process.env.GOOGLE_CLIENT_ID = "";
  process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";

  expectInvalidGoogleEnvironment();
});

test("rejects a missing Google OAuth client secret", () => {
  process.env.GOOGLE_CLIENT_ID = "google-client-id";
  delete process.env.GOOGLE_CLIENT_SECRET;

  expectInvalidGoogleEnvironment();
});

test("rejects an empty Google OAuth client secret", () => {
  process.env.GOOGLE_CLIENT_ID = "google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "";

  expectInvalidGoogleEnvironment();
});
