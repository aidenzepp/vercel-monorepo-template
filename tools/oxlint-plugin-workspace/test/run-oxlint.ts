import { randomUUID } from "node:crypto";
import { copyFileSync, rmSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

/**
 * The repository root used as the working directory for integration lint runs.
 */
const workspaceRoot = path.resolve(import.meta.dir, "../../..");

/**
 * Lists the files an Oxlint configuration selects beneath one repository
 * path.
 *
 * @param configName - The configuration path relative to this test directory.
 * @param targetPath - The repository-relative file or directory to inspect.
 * @returns The selected files and process status emitted by Oxlint.
 */
export const listOxlintFiles = (configName: string, targetPath: string) => {
  const process = Bun.spawnSync({
    cmd: [
      "bunx",
      "oxlint",
      "--config",
      path.resolve(import.meta.dir, configName),
      "--debug=files",
      targetPath,
    ],
    cwd: workspaceRoot,
    stderr: "pipe",
    stdout: "pipe",
  });

  return {
    exitCode: process.exitCode,
    files: process.stdout
      .toString()
      .trim()
      .split("\n")
      .filter((file) => file.length > 0),
    stderr: process.stderr.toString(),
  };
};

/**
 * Validates the stable diagnostic fields consumed by the integration
 * assertions.
 */
const oxlintOutputSchema = z.object({
  diagnostics: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
    })
  ),
});

/**
 * Executes Oxlint against one controlled fixture and parses its JSON output.
 *
 * @param configName - The test configuration filename.
 * @param fixtureName - The fixture filename beneath the fixtures directory.
 * @param targetDirectory - An optional repository directory where the fixture
 *   must be evaluated.
 * @returns The process result and validated diagnostic records.
 */
const executeOxlint = (
  configName: string,
  fixtureName: string,
  targetDirectory?: string
) => {
  const configPath = path.resolve(import.meta.dir, configName);
  const sourceFixturePath = path.resolve(
    import.meta.dir,
    "fixtures",
    fixtureName
  );
  const fixturePath =
    targetDirectory === undefined
      ? sourceFixturePath
      : path.resolve(
          workspaceRoot,
          targetDirectory,
          `.oxlint-fixture-${randomUUID()}-${fixtureName}`
        );

  if (targetDirectory !== undefined) {
    copyFileSync(sourceFixturePath, fixturePath);
  }

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

  if (targetDirectory !== undefined) {
    rmSync(fixturePath);
  }

  const rawOutput: unknown = JSON.parse(process.stdout.toString());
  const output = oxlintOutputSchema.parse(rawOutput);

  return {
    diagnostics: output.diagnostics,
    exitCode: process.exitCode,
    stderr: process.stderr.toString(),
  };
};

/**
 * Runs Oxlint against one controlled fixture with an isolated rule
 * configuration.
 *
 * @param configName - The test configuration filename.
 * @param fixtureName - The fixture filename beneath the fixtures directory.
 * @returns The process result and emitted diagnostic messages.
 */
export const runOxlint = (configName: string, fixtureName: string) => {
  const result = executeOxlint(configName, fixtureName);

  return {
    diagnostics: result.diagnostics.map(({ message }) => message),
    exitCode: result.exitCode,
    stderr: result.stderr,
  };
};

/**
 * Runs Oxlint against one controlled fixture and includes rule identifiers.
 *
 * @param configName - The test configuration filename.
 * @param fixtureName - The fixture filename beneath the fixtures directory.
 * @param targetDirectory - An optional repository directory where the fixture
 *   must be evaluated.
 * @returns The process result plus each emitted rule identifier.
 */
export const runOxlintWithCodes = (
  configName: string,
  fixtureName: string,
  targetDirectory?: string
) => {
  const result = executeOxlint(configName, fixtureName, targetDirectory);

  return {
    codes: result.diagnostics.map(({ code }) => code),
    diagnostics: result.diagnostics.map(({ message }) => message),
    exitCode: result.exitCode,
    stderr: result.stderr,
  };
};
