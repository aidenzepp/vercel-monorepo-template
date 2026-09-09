import path from "node:path";
import { parseArgs } from "node:util";

import { z } from "zod";

import packageJson from "../package.json" with { type: "json" };

const neonRegions = [
  "cle1",
  "iad1",
  "pdx1",
  "fra1",
  "lhr1",
  "syd1",
  "sin1",
  "gru1",
] as const;

const regionSchema = z.enum(neonRegions, {
  error: (issue) =>
    `Unsupported region "${String(issue.input)}". Choose one of: ${neonRegions.join(", ")}.`,
});

const optionsSchema = z
  .object({
    region: regionSchema.default("iad1"),
  })
  .strict();

type SetupOptions = z.infer<typeof optionsSchema>;

type SetupStep = Readonly<{
  arguments: readonly string[];
  directory: string;
  label: string;
}>;

type ParsedOptions =
  | Readonly<{ ok: true; value: SetupOptions }>
  | Readonly<{ error: string; ok: false }>;

const repositoryRoot = path.resolve(import.meta.dir, "..");
const webDirectory = path.join(repositoryRoot, "apps/web");
const marketingDirectory = path.join(repositoryRoot, "apps/mkt");

const parseOptions = (arguments_: string[]): ParsedOptions => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: arguments_,
    options: {
      region: { type: "string" },
    },
    strict: false,
  });

  if (positionals.length > 0) {
    return {
      error: `Unexpected arguments: ${positionals.join(", ")}`,
      ok: false,
    };
  }

  const parsed = optionsSchema.safeParse(values);

  if (parsed.success) {
    return { ok: true, value: parsed.data };
  }

  const [issue] = parsed.error.issues;

  if (issue?.code === "unrecognized_keys") {
    return {
      error: issue.keys.map((key) => `Unrecognized option "${key}"`).join("\n"),
      ok: false,
    };
  }

  return {
    error: issue?.message ?? z.prettifyError(parsed.error),
    ok: false,
  };
};

const normalizeResourceName = (packageName: string): string => {
  const unscopedName = packageName.split("/").at(-1) ?? packageName;

  return unscopedName
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/gu, "-")
    .replaceAll(/-+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
};

const createPlan = (
  resourceName: string,
  region: SetupOptions["region"]
): SetupStep[] => [
  {
    arguments: ["link"],
    directory: webDirectory,
    label: "Link the authenticated web app to its Vercel project",
  },
  {
    arguments: [
      "integration",
      "add",
      "neon",
      "--name",
      `${resourceName}-apps-web`,
      "--plan",
      "free_v3",
      "--metadata",
      `region=${region}`,
      "--metadata",
      "auth=false",
      "--no-connect",
    ],
    directory: webDirectory,
    label: "Provision Neon for web",
  },
  {
    arguments: [
      "blob",
      "create-store",
      `${resourceName}-apps-web`,
      "--access",
      "private",
      "--region",
      region,
    ],
    directory: webDirectory,
    label: "Provision and connect a private Blob store to web",
  },
  {
    arguments: [
      "integration",
      "add",
      "resend",
      "--name",
      `${resourceName}-apps-web-email`,
      "--no-env-pull",
    ],
    directory: webDirectory,
    label: "Provision and connect Resend to web",
  },
  {
    arguments: ["link"],
    directory: marketingDirectory,
    label: "Link the database-free marketing app to its Vercel project",
  },
];

const printPlan = (
  plan: readonly SetupStep[],
  resourceName: string,
  region: string
): void => {
  console.log(
    `Applying the opinionated service setup for ${resourceName} in ${region}.`
  );
  console.table(
    plan.map((step, index) => ({
      Action: step.label,
      Directory: path.relative(repositoryRoot, step.directory),
      Step: index + 1,
    }))
  );
};

const runPlan = async (
  vercel: string,
  plan: readonly SetupStep[]
): Promise<number> => {
  for (const [index, step] of plan.entries()) {
    console.log(`\n${index + 1}/${plan.length} ${step.label}`);
    console.log(`$ vercel ${step.arguments.join(" ")}`);

    const command = Bun.spawn([vercel, ...step.arguments], {
      cwd: step.directory,
      stderr: "inherit",
      stdin: "inherit",
      stdout: "inherit",
    });
    // Cloud mutations must remain serial so each prompt and failure is resolved
    // before the next resource is created.
    // oxlint-disable-next-line no-await-in-loop
    const exitCode = await command.exited;

    if (exitCode !== 0) {
      console.error(
        `Setup stopped at step ${index + 1}. Resolve the Vercel prompt or error, then rerun the command; completed resources are left intact.`
      );
      return exitCode;
    }
  }

  return 0;
};

const printNextSteps = (resourceName: string): void => {
  console.log(`
Service provisioning completed. Neon is not connected yet.

Connect Neon to the web project:
  Vercel Dashboard → Storage → ${resourceName}-apps-web → Connect Project
  • Environments: Development, Preview, and Production
  • Require the resource before deployment
  • Enable Preview branching; leave Production branching off
  • Leave the environment-variable prefix empty

After connecting Neon and adding the application-owned variables, pull Development values:
  cd apps/web
  vercel env pull ../../.env.local --environment=development

Required application variables:
  APP_NAME, BETTER_AUTH_URL, BETTER_AUTH_API_KEY, BETTER_AUTH_SECRET,
  OAUTH_PROXY_SECRET, and RESEND_FROM_EMAIL`);
};

const main = async (arguments_: string[]): Promise<number> => {
  const options = parseOptions(arguments_);

  if (!options.ok) {
    console.error(options.error);
    return 1;
  }

  const resourceName = normalizeResourceName(packageJson.name);

  if (resourceName.length === 0) {
    console.error(
      "The root package name must contain letters or numbers before setup can derive cloud resource names."
    );
    return 1;
  }

  const vercel = Bun.which("vercel");

  if (vercel === null) {
    console.error("Vercel CLI is not available on PATH.");
    return 1;
  }

  const plan = createPlan(resourceName, options.value.region);
  printPlan(plan, resourceName, options.value.region);

  const exitCode = await runPlan(vercel, plan);

  if (exitCode === 0) {
    printNextSteps(resourceName);
  }

  return exitCode;
};

if (import.meta.path === Bun.main) {
  process.exitCode = await main(Bun.argv.slice(2));
}
