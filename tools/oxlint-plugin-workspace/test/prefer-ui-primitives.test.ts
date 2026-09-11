import { describe, expect, test } from "bun:test";
import path from "node:path";

import { z } from "zod";

/**
 * The repository root used as the working directory for integration lint runs.
 */
const workspaceRoot = path.resolve(import.meta.dir, "../../..");

/**
 * The isolated Oxlint configuration that enables only the rule under test.
 */
const configPath = path.resolve(import.meta.dir, "oxlint.config.mjs");

/**
 * Validates the stable diagnostic fields consumed by the integration
 * assertions.
 */
const oxlintOutputSchema = z.object({
  diagnostics: z.array(
    z.object({
      message: z.string(),
    })
  ),
});

/**
 * Runs Oxlint against one controlled JSX fixture with only the workspace rule
 * enabled.
 *
 * @param fixture - The fixture whose diagnostics should be captured.
 * @returns The process result and emitted diagnostics.
 */
const runOxlint = (fixture: "allowed.tsx" | "forbidden.tsx") => {
  const fixturePath = path.resolve(import.meta.dir, "fixtures", fixture);
  const process = Bun.spawnSync({
    cmd: [
      "bunx",
      "oxlint",
      "--config",
      configPath,
      "--format",
      "json",
      fixturePath,
    ],
    cwd: workspaceRoot,
    stderr: "pipe",
    stdout: "pipe",
  });
  const rawOutput: unknown = JSON.parse(process.stdout.toString());
  const output = oxlintOutputSchema.parse(rawOutput);

  return {
    diagnostics: output.diagnostics.map(({ message }) => message),
    exitCode: process.exitCode,
    stderr: process.stderr.toString(),
  };
};

describe("workspace/prefer-ui-primitives", () => {
  test("reports every native element with a direct application primitive", () => {
    const result = runOxlint("forbidden.tsx");
    const expectedMessages = [
      "Do not use <button> in application UI. Use the existing shared Button or a specialized shared button primitive.",
      "Do not use <input> in application UI. Use the shared Input component.",
      "Do not use <textarea> in application UI. Use the shared Textarea component.",
      "Do not use <select> in application UI. Use the shared Select or NativeSelect component.",
      "Do not use <label> in application UI. Use the shared Label or FieldLabel component.",
      "Do not use <img> in application UI. Use Next.js Image from next/image or the shared AvatarImage component.",
      "Do not use <fieldset> in application UI. Use the shared FieldSet component.",
      "Do not use <legend> in application UI. Use the shared FieldLegend component.",
      "Do not use <option> in application UI. Use the shared NativeSelectOption component.",
      "Do not use <optgroup> in application UI. Use the shared NativeSelectOptGroup component.",
      "Do not use <progress> in application UI. Use the shared Progress component.",
      "Do not use <hr> in application UI. Use the shared Separator component.",
      "Do not use <kbd> in application UI. Use the shared Kbd component.",
      "Do not use <dialog> in application UI. Use the shared Dialog or AlertDialog component.",
      "Do not use <details> in application UI. Use the shared Collapsible or Accordion components.",
      "Do not use <summary> in application UI. Use the shared Collapsible or Accordion components.",
      "Do not use <table> in application UI. Use the shared Table component.",
      "Do not use <thead> in application UI. Use the shared TableHeader component.",
      "Do not use <tbody> in application UI. Use the shared TableBody component.",
      "Do not use <tfoot> in application UI. Use the shared TableFooter component.",
      "Do not use <tr> in application UI. Use the shared TableRow component.",
      "Do not use <th> in application UI. Use the shared TableHead component.",
      "Do not use <td> in application UI. Use the shared TableCell component.",
      "Do not use <caption> in application UI. Use the shared TableCaption component.",
    ];

    expect(result).toEqual({
      diagnostics: expectedMessages,
      exitCode: 1,
      stderr: "",
    });
  });

  test("allows semantic structural elements without direct replacements", () => {
    const result = runOxlint("allowed.tsx");

    expect(result).toEqual({
      diagnostics: [],
      exitCode: 0,
      stderr: "",
    });
  });
});
