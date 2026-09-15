import { describe, expect, test } from "bun:test";

import shadcn from "ultracite/oxlint/shadcn";

import { listOxlintFiles, runOxlint, runOxlintWithCodes } from "./run-oxlint";

/**
 * Converts an Oxlint rule name to the diagnostic identifier emitted by its
 * JavaScript plugin.
 *
 * @param ruleName - The slash-delimited plugin and rule name.
 * @returns The parenthesized diagnostic identifier emitted by Oxlint.
 */
const toJsPluginDiagnosticCode = (ruleName: string) =>
  `${ruleName.replace("/", "(")})`;

/**
 * Every rule currently owned by Ultracite's Shadcn preset.
 */
const shadcnRuleNames = Object.keys(shadcn.rules ?? {});

describe("workspace Shadcn lint coverage", () => {
  test("excludes generated shared component implementations", () => {
    const result = listOxlintFiles(
      "../../../oxlint.config.ts",
      "packages/ui/src/components/button.tsx"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.files).toEqual([]);
  });

  test("enforces every upstream rule through the root config", () => {
    const result = runOxlintWithCodes(
      "../../../oxlint.config.ts",
      "shadcn-preset.tsx",
      "apps/web"
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(shadcnRuleNames).not.toHaveLength(0);
    for (const ruleCode of shadcnRuleNames.map(toJsPluginDiagnosticCode)) {
      expect(result.codes).toContain(ruleCode);
    }
    expect(
      result.diagnostics.some((message) =>
        message.includes('"bg-pink-500" is not allowed on <Button>: use color')
      )
    ).toBe(true);
  });
});

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
