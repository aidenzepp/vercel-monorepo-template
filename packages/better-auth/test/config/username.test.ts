import { describe, expect, test } from "bun:test";

import { usernameSchema } from "../../src/config/username.js";

describe("usernameSchema", () => {
  test("normalizes surrounding whitespace and capitalization", () => {
    expect<string>(usernameSchema.parse(" USER_NAME ")).toBe("user_name");
  });

  test("accepts the supported characters and length boundaries", () => {
    expect(usernameSchema.safeParse("a").success).toBe(true);
    expect(usernameSchema.safeParse("user.name_1").success).toBe(true);
    expect(usernameSchema.safeParse("a".repeat(30)).success).toBe(true);
  });

  test.each([
    ["an empty username", ""],
    ["an overlong username", "a".repeat(31)],
    ["internal whitespace", "user name"],
    ["unsupported punctuation", "user-name"],
    ["a leading period", ".username"],
    ["a trailing period", "username."],
    ["consecutive periods", "user..name"],
  ])("rejects %s", (_description, value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });
});
