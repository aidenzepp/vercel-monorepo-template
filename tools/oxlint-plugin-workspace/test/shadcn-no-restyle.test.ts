import { describe, expect, test } from "bun:test";

import { runOxlint } from "./run-oxlint";

describe("shadcn/no-restyle", () => {
  test("allows composition layout but rejects Button-owned appearance", () => {
    const result = runOxlint(
      "shadcn-no-restyle.oxlint.config.mjs",
      "shadcn-no-restyle.tsx"
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.diagnostics).toHaveLength(2);
    expect(
      result.diagnostics.some((message) =>
        message.includes(
          '"p-8" is not allowed on <Button>: use a size (default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg)'
        )
      )
    ).toBe(true);
    expect(
      result.diagnostics.some((message) =>
        message.includes(
          '"bg-destructive" is not allowed on <Button>: use color (default, neutral, destructive, success, warning)'
        )
      )
    ).toBe(true);
  });
});
