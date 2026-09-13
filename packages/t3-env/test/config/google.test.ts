import { afterEach, expect, test } from "bun:test";

import { google } from "../../src/config/google";

const ORIGINAL_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ORIGINAL_GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

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

test("rejects missing or empty Google OAuth client credentials", () => {
  delete process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_SECRET = "";

  expect(() => google()).toThrow();
});
