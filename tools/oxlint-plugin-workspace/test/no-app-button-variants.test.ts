import { describe, expect, test } from "bun:test";

import { runOxlint } from "./run-oxlint";

describe("workspace/no-app-button-variants", () => {
  test("allows Button composition without importing its style recipe", () => {
    const result = runOxlint(
      "no-app-button-variants.oxlint.config.mjs",
      "button-variants-allowed.tsx"
    );

    expect(result).toEqual({
      diagnostics: [],
      exitCode: 0,
      stderr: "",
    });
  });

  test("reports aliased buttonVariants imports", () => {
    const result = runOxlint(
      "no-app-button-variants.oxlint.config.mjs",
      "button-variants-forbidden.tsx"
    );

    expect(result).toEqual({
      diagnostics: [
        "Do not import buttonVariants in application code. Render Button with its render prop so the shared primitive owns button styling and interaction.",
      ],
      exitCode: 1,
      stderr: "",
    });
  });
});
