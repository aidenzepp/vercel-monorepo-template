import path from "node:path";

import { z } from "zod";

/**
 * The repository root used as the working directory for integration lint runs.
 */
const workspaceRoot = path.resolve(import.meta.dir, "../../..");

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
 * Runs Oxlint against one controlled fixture with an isolated rule
 * configuration.
 *
 * @param configName - The test configuration filename.
 * @param fixtureName - The fixture filename beneath the fixtures directory.
 * @returns The process result and emitted diagnostics.
 */
export const runOxlint = (configName: string, fixtureName: string) => {
  const configPath = path.resolve(import.meta.dir, configName);
  const fixturePath = path.resolve(import.meta.dir, "fixtures", fixtureName);
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
