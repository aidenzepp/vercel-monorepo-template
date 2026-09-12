import { describe, expect, test } from "bun:test";

import { runOxlint } from "./run-oxlint";

describe("workspace/require-doc-comment", () => {
  test("allows documented declarations and structural props types", () => {
    const result = runOxlint(
      "require-doc-comment.oxlint.config.mjs",
      "documented.tsx"
    );

    expect(result).toEqual({
      diagnostics: [],
      exitCode: 0,
      stderr: "",
    });
  });

  test("reports undocumented module declarations and named helpers", () => {
    const result = runOxlint(
      "require-doc-comment.oxlint.config.mjs",
      "undocumented.tsx"
    );

    expect(result).toEqual({
      diagnostics: [
        "Document `label` with a multiline JSDoc block that states its contract and system role.",
        "Document `UserRecord` with a multiline JSDoc block that states its contract and system role.",
        "Document `UserFormatter` with a multiline JSDoc block that states its contract and system role.",
        "Document `Undocumented` with a multiline JSDoc block that states its contract and system role.",
        "Document `formatLabel` with a multiline JSDoc block that states its contract and system role.",
      ],
      exitCode: 1,
      stderr: "",
    });
  });
});
