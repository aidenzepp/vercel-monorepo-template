import { afterEach, describe, expect, test } from "bun:test";
import { chmod, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const scriptPath = path.join(import.meta.dir, "setup-services.ts");
const temporaryDirectories = new Set<string>();

interface SetupResult {
  exitCode: number;
  invocations: string[];
  stderr: string;
  stdout: string;
}

afterEach(async () => {
  await Promise.all(
    [...temporaryDirectories].map(async (directory) => {
      await rm(directory, { force: true, recursive: true });
    })
  );
  temporaryDirectories.clear();
});

const runSetup = async (arguments_: string[]): Promise<SetupResult> => {
  const binDirectory = await mkdtemp(
    path.join(tmpdir(), "vercel-template-setup-")
  );
  temporaryDirectories.add(binDirectory);

  const invocationLog = path.join(binDirectory, "vercel.log");
  const vercelExecutable = path.join(binDirectory, "vercel");

  await Bun.write(
    vercelExecutable,
    '#!/bin/sh\nprintf "%s\\t%s\\n" "$PWD" "$*" >> "$VERCEL_TEST_LOG"\n'
  );
  await chmod(vercelExecutable, 0o755);

  const setup = Bun.spawn(
    [Bun.which("bun") ?? "bun", scriptPath, ...arguments_],
    {
      cwd: repositoryRoot,
      env: {
        ...Bun.env,
        PATH: `${binDirectory}:${Bun.env.PATH ?? ""}`,
        VERCEL_TEST_LOG: invocationLog,
      },
      stderr: "pipe",
      stdout: "pipe",
    }
  );

  const [exitCode, stderr, stdout] = await Promise.all([
    setup.exited,
    new Response(setup.stderr).text(),
    new Response(setup.stdout).text(),
  ]);
  const logExists = await Bun.file(invocationLog).exists();
  const logContents = logExists ? await Bun.file(invocationLog).text() : "";
  const invocations =
    logContents.length > 0 ? logContents.trim().split("\n") : [];

  return { exitCode, invocations, stderr, stdout };
};

describe("setup services", () => {
  test("applies the setup, leaves Neon disconnected, and defers the environment pull", async () => {
    const result = await runSetup([]);
    const webDirectory = path.join(repositoryRoot, "apps/web");
    const marketingDirectory = path.join(repositoryRoot, "apps/mkt");

    expect(result.exitCode).toBe(0);
    expect(result.invocations).toEqual([
      `${webDirectory}\tlink`,
      `${webDirectory}\tintegration add neon --name vercel-monorepo-template-apps-web --plan free_v3 --metadata region=iad1 --metadata auth=false --no-connect`,
      `${webDirectory}\tblob create-store vercel-monorepo-template-apps-web --access private --region iad1`,
      `${webDirectory}\tintegration add resend --name vercel-monorepo-template-apps-web-email --no-env-pull`,
      `${marketingDirectory}\tlink`,
    ]);
    expect(result.stdout).toContain("Connect Neon to the web project");
    expect(result.stdout).toContain("Preview branching");
    expect(result.stdout).toContain("vercel env pull ../../.env.local");
  });

  test("accepts a supported Neon region", async () => {
    const result = await runSetup(["--region=fra1"]);

    expect(result.exitCode).toBe(0);
    expect(result.invocations.join("\n")).toContain("region=fra1");
    expect(result.invocations.join("\n")).toContain("--region fra1");
  });

  test("rejects a region that Neon does not offer", async () => {
    const result = await runSetup(["--region=sfo1"]);

    expect(result.exitCode).toBe(1);
    expect(result.invocations).toEqual([]);
    expect(result.stderr).toContain('Unsupported region "sfo1"');
  });

  test("rejects unknown options", async () => {
    const result = await runSetup(["--apply"]);

    expect(result.exitCode).toBe(1);
    expect(result.invocations).toEqual([]);
    expect(result.stderr).toContain('Unrecognized option "apply"');
  });

  test("rejects positional arguments", async () => {
    const result = await runSetup(["unexpected"]);

    expect(result.exitCode).toBe(1);
    expect(result.invocations).toEqual([]);
    expect(result.stderr).toContain("Unexpected arguments: unexpected");
  });
});
