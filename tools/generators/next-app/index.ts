import path from "node:path";

import commands from "./commands.json" with { type: "json" };

/**
 * Accepted app names use lowercase kebab-case and begin with a letter.
 */
const APP_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

/**
 * One external command in the generated app setup sequence.
 */
type Command = Readonly<{
  /** The executable followed by the arguments passed to it. */
  argv: readonly string[];
  /** The directory from which the command runs. */
  cwd: string;
  /** A longer explanation of the command's purpose and effect. */
  description: string;
  /** A short action label shown before the command runs. */
  label: string;
}>;

/**
 * Commands run serially in the order declared in commands.json.
 */
const commandSequence: readonly Command[] = commands;

/**
 * Read the requested app name and enforce the repository's naming convention.
 */
const readAppName = (): string => {
  const [appName, ...extraArguments] = Bun.argv.slice(2);

  if (
    appName === undefined ||
    extraArguments.length > 0 ||
    !APP_NAME_PATTERN.test(appName)
  ) {
    throw new Error(
      "App names use lowercase letters, numbers, and single hyphens, and start with a letter."
    );
  }

  return appName;
};

/**
 * Replace the path and name markers used by a command template.
 */
const fillTemplate = (
  template: string,
  replacements: Readonly<Record<string, string>>
): string => {
  let result = template;

  for (const [marker, value] of Object.entries(replacements)) {
    result = result.replaceAll(marker, value);
  }

  return result;
};

/**
 * Run one command and stop when its underlying CLI fails.
 */
const runCommand = async (
  command: Command,
  replacements: Readonly<Record<string, string>>
): Promise<void> => {
  const label = fillTemplate(command.label, replacements);
  const description = fillTemplate(command.description, replacements);
  const cwd = fillTemplate(command.cwd, replacements);
  const argv = command.argv.map((argument) =>
    fillTemplate(argument, replacements)
  );

  process.stdout.write(`\n${label}\n${description}\n`);

  const child = Bun.spawn(argv, {
    cwd,
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  });

  const exitCode = await child.exited;

  if (exitCode !== 0) {
    throw new Error(
      `Failed to run "${label}". Command exited with code ${exitCode}.`
    );
  }
};

/**
 * Create a ShadCN Next.js app and normalize it for this workspace.
 */
const createNextApp = async (): Promise<void> => {
  const appName = readAppName();
  const repositoryRootPath = path.resolve(import.meta.dir, "../../..");
  const repositoryAppsPath = path.join(repositoryRootPath, "apps");
  const absoluteAppPath = path.join(repositoryAppsPath, appName);
  const relativeAppPath = path.relative(repositoryRootPath, absoluteAppPath);

  const replacements = {
    $ABSOLUTE_APP_PATH: absoluteAppPath,
    $APP_NAME: appName,
    $RELATIVE_APP_PATH: relativeAppPath,
    $REPOSITORY_APPS_PATH: repositoryAppsPath,
    $REPOSITORY_ROOT_PATH: repositoryRootPath,
  };

  for (const command of commandSequence) {
    // Commands mutate the same app and must finish in their declared order.
    // oxlint-disable-next-line no-await-in-loop
    await runCommand(command, replacements);
  }

  process.stdout.write(
    `\n✓ Created @workspace/${appName} at ${absoluteAppPath}\n`
  );
};

if (import.meta.main) {
  await createNextApp();
}
