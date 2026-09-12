import path from "node:path";
import { parseArgs } from "node:util";

import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";
import { z } from "zod";

import packageJson from "../package.json" with { type: "json" };

/**
 * Neon regions accepted by the guided Vercel integration setup.
 */
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

/**
 * Vercel environments that receive shared service credentials.
 */
const vercelEnvironments = ["development", "preview", "production"] as const;

/**
 * Reusable Vercel CLI arguments that connect a service to every environment.
 */
const environmentArguments = vercelEnvironments.flatMap((environment) => [
  "--environment",
  environment,
]);

/**
 * Validates requested regions before any cloud resource is created.
 */
const regionSchema = z.enum(neonRegions, {
  error: (issue) =>
    `SETUP_REGION_UNSUPPORTED: Unsupported region "${String(issue.input)}". Choose one of: ${neonRegions.join(", ")}.`,
});

/**
 * Validates the optional domain Resend will configure for sending mail.
 */
const resendDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z.hostname({
      error:
        "SETUP_RESEND_DOMAIN_INVALID: Enter a domain you own, such as example.com.",
    })
  )
  .refine((domain) => domain.includes("."), {
    error:
      "SETUP_RESEND_DOMAIN_INVALID: Enter a domain you own, such as example.com.",
  });

/**
 * Parses the complete, supported setup command input.
 */
const optionsSchema = z.object({
  region: regionSchema.default("iad1"),
  resendDomain: resendDomainSchema.optional(),
});

/**
 * Validates the Vercel project identity persisted by `vercel link`.
 */
const projectLinkSchema = z.object({
  orgId: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1),
});

/**
 * Valid setup options after command-line parsing and validation.
 */
type SetupOptions = z.infer<typeof optionsSchema>;

/**
 * Verified Vercel project identity loaded from one linked application.
 */
type ProjectLink = z.infer<typeof projectLinkSchema>;

/**
 * One serial Vercel CLI operation in the setup plan.
 */
type SetupStep = Readonly<{
  arguments: readonly string[];
  directory: string;
  label: string;
}>;

/**
 * A provider-provisioning step paired with the resource it may create.
 */
type ServiceStep = SetupStep & Readonly<{ resourceName: string }>;

/**
 * The exact interruption point and prior progress of a failed plan.
 */
type PlanFailure = Readonly<{
  completed: readonly string[];
  error: string;
  exitCode: number;
  failed: SetupStep;
  ok: false;
}>;

/**
 * Completion state returned after executing a serial setup plan.
 */
type PlanResult = Readonly<{ ok: true }> | PlanFailure;

/**
 * User input after either successful validation or actionable rejection.
 */
type ParsedOptions =
  | Readonly<{ ok: true; value: SetupOptions }>
  | Readonly<{ error: string; ok: false }>;

/**
 * Deterministic cross-application names for every planned provider resource.
 */
type ResourceNames = Readonly<{
  blob: string;
  neon: string;
  resend: string;
}>;

/**
 * Distinct verified projects for the marketing and authenticated applications.
 */
type ProjectLinks = Readonly<{
  marketing: ProjectLink;
  web: ProjectLink;
}>;

/**
 * Absolute repository root used to resolve application working directories.
 */
const repositoryRoot = path.resolve(import.meta.dir, "..");

/**
 * Authenticated application directory used for linking and provisioning.
 */
const webDirectory = path.join(repositoryRoot, "apps/web");

/**
 * Marketing application directory used for its independent Vercel link.
 */
const marketingDirectory = path.join(repositoryRoot, "apps/mkt");

/**
 * Placeholder package name that must be replaced before cloud setup.
 */
const templatePackageName = "vercel-monorepo-template";

/**
 * Parses supported command-line options without accepting silent extras.
 *
 * @param arguments_ - Arguments passed after the setup script name.
 * @returns Validated setup options or one actionable input error.
 */
const parseOptions = (arguments_: string[]): ParsedOptions => {
  const { positionals, tokens } = parseArgs({
    allowPositionals: true,
    args: arguments_,
    options: {
      region: { type: "string" },
      "resend-domain": { type: "string" },
    },
    strict: false,
    tokens: true,
  });

  const optionTokens = tokens.filter((token) => token.kind === "option");
  const unknownOptions = optionTokens.filter(
    (token) => token.name !== "region" && token.name !== "resend-domain"
  );

  if (unknownOptions.length > 0) {
    const names = unknownOptions
      .map((token) => `"${token.rawName}"`)
      .join(", ");

    return {
      error: `SETUP_OPTION_UNKNOWN: Unrecognized option${unknownOptions.length === 1 ? "" : "s"}: ${names}. Use: bun run setup:services [--resend-domain=<domain>] [--region=<region>]`,
      ok: false,
    };
  }

  if (positionals.length > 0) {
    return {
      error: `SETUP_ARGUMENT_UNEXPECTED: Unexpected argument${positionals.length === 1 ? "" : "s"}: ${positionals.join(", ")}. Use: bun run setup:services [--resend-domain=<domain>] [--region=<region>]`,
      ok: false,
    };
  }

  const regionTokens = optionTokens.filter((token) => token.name === "region");

  if (regionTokens.length > 1) {
    const values = regionTokens
      .map((token) => token.value ?? token.rawName)
      .join(", ");

    return {
      error: `SETUP_REGION_DUPLICATE: Pass --region only once. Received: ${values}.`,
      ok: false,
    };
  }

  const regionToken = regionTokens.at(0);

  if (
    regionToken &&
    (regionToken.value === undefined || regionToken.value.startsWith("-"))
  ) {
    return {
      error:
        "SETUP_REGION_MISSING: --region requires a value. Use: bun run setup:services --region=iad1",
      ok: false,
    };
  }

  const resendDomainTokens = optionTokens.filter(
    (token) => token.name === "resend-domain"
  );

  if (resendDomainTokens.length > 1) {
    const values = resendDomainTokens
      .map((token) => token.value ?? token.rawName)
      .join(", ");

    return {
      error: `SETUP_RESEND_DOMAIN_DUPLICATE: Pass --resend-domain only once. Received: ${values}.`,
      ok: false,
    };
  }

  const resendDomainToken = resendDomainTokens.at(0);

  if (
    resendDomainToken &&
    (resendDomainToken.value === undefined ||
      resendDomainToken.value.startsWith("-"))
  ) {
    return {
      error:
        "SETUP_RESEND_DOMAIN_MISSING: --resend-domain requires a value. Use: bun run setup:services --resend-domain=example.com",
      ok: false,
    };
  }

  const parsed = optionsSchema.safeParse({
    region: regionToken?.value,
    resendDomain: resendDomainToken?.value,
  });

  if (parsed.success) {
    return { ok: true, value: parsed.data };
  }

  return {
    error: parsed.error.issues.at(0)?.message ?? z.prettifyError(parsed.error),
    ok: false,
  };
};

/**
 * Converts a package name into the stable Vercel resource-name stem.
 *
 * @param packageName - The root package name selected by the template owner.
 * @returns A lowercase, unscoped, hyphen-safe resource name.
 */
const normalizeResourceName = (packageName: string): string => {
  const unscopedName = packageName.split("/").at(-1) ?? packageName;

  return unscopedName
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/gu, "-")
    .replaceAll(/-+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
};

/**
 * Derives the provider resource names shared across both applications.
 *
 * @param resourceName - The normalized root package name.
 * @returns Names for the Blob, Neon, and Resend resources.
 */
const createResourceNames = (resourceName: string): ResourceNames => ({
  blob: `blob-${resourceName}-apps`,
  neon: `neon-${resourceName}-apps`,
  resend: `resend-${resourceName}-apps`,
});

/**
 * Creates the application-linking plan that must succeed before provisioning.
 *
 * @returns Serial link steps for the authenticated and marketing applications.
 */
const createLinkPlan = (): SetupStep[] => [
  {
    arguments: ["link"],
    directory: webDirectory,
    label: "Link the authenticated web app to its Vercel project",
  },
  {
    arguments: ["link"],
    directory: marketingDirectory,
    label: "Link the database-free marketing app to its Vercel project",
  },
];

/**
 * Creates the CLI-safe provider plan for the verified Vercel scope.
 *
 * Blob is deliberately absent because Vercel's dashboard is the only verified
 * creation flow that exposes the OIDC connection choice before provisioning.
 *
 * @param names - Deterministic names for the CLI-provisioned resources.
 * @param options - Validated region and optional Resend domain.
 * @param scope - Vercel organization that owns the linked applications.
 * @returns Neon and optional Resend steps, with Blob left to the dashboard.
 */
const createServicePlan = (
  names: ResourceNames,
  options: SetupOptions,
  scope: ProjectLink["orgId"]
): ServiceStep[] => {
  const plan: ServiceStep[] = [
    {
      arguments: [
        "integration",
        "add",
        "neon",
        "--name",
        names.neon,
        "--plan",
        "free_v3",
        "--metadata",
        `region=${options.region}`,
        "--metadata",
        "auth=false",
        "--no-connect",
        "--scope",
        scope,
      ],
      directory: webDirectory,
      label: "Provision Neon for the apps",
      resourceName: names.neon,
    },
  ];

  if (options.resendDomain === undefined) {
    return plan;
  }

  plan.push({
    arguments: [
      "integration",
      "add",
      "resend",
      "--name",
      names.resend,
      "--plan",
      "free",
      "--metadata",
      `domain=${options.resendDomain}`,
      "--metadata",
      "region=us-east-1",
      ...environmentArguments,
      "--no-env-pull",
      "--scope",
      scope,
    ],
    directory: webDirectory,
    label: "Provision and connect Resend",
    resourceName: names.resend,
  });

  return plan;
};

/**
 * Prints a readable preview of the serial operations about to run.
 *
 * @param heading - Context shown before the plan table.
 * @param plan - Ordered steps that will be executed.
 */
const printPlan = (heading: string, plan: readonly SetupStep[]): void => {
  console.log(heading);
  console.table(
    plan.map((step, index) => ({
      Action: step.label,
      Directory: path.relative(repositoryRoot, step.directory),
      Step: index + 1,
    }))
  );
};

/**
 * Executes a Vercel CLI plan serially and stops at the first failure.
 *
 * @param vercel - Absolute path to the installed Vercel CLI.
 * @param plan - Ordered operations to execute.
 * @returns Completion or the exact failed step and completed prefix.
 */
const runPlan = async (
  vercel: string,
  plan: readonly SetupStep[]
): Promise<PlanResult> => {
  for (const [index, step] of plan.entries()) {
    console.log(`\n${index + 1}/${plan.length} ${step.label}`);
    console.log(`$ vercel ${step.arguments.join(" ")}`);

    // Cloud mutations must remain serial so each prompt and failure is resolved
    // before the next resource is created.
    // oxlint-disable-next-line no-await-in-loop
    const execution = await result.trycatch(async () => {
      const command = Bun.spawn([vercel, ...step.arguments], {
        cwd: step.directory,
        stderr: "inherit",
        stdin: "inherit",
        stdout: "inherit",
      });

      return await command.exited;
    });

    const completed = plan.slice(0, index).map(({ label }) => label);

    if (!execution.ok) {
      return {
        completed,
        error: execution.error.message,
        exitCode: 1,
        failed: step,
        ok: false,
      };
    }

    if (execution.value !== 0) {
      return {
        completed,
        error: `Vercel exited with code ${execution.value}`,
        exitCode: execution.value,
        failed: step,
        ok: false,
      };
    }
  }

  return { ok: true };
};

/**
 * Loads and validates the project identity written by `vercel link`.
 *
 * @param appName - Human-readable application name used in errors.
 * @param directory - Linked application directory containing `.vercel` state.
 * @returns The verified project link or an actionable filesystem failure.
 */
const loadProjectLink = async (
  appName: string,
  directory: string
): Promise<Result<ProjectLink>> => {
  const linkPath = path.join(directory, ".vercel/project.json");
  const relativeLinkPath = path.relative(repositoryRoot, linkPath);
  const relativeDirectory = path.relative(repositoryRoot, directory);
  const linkFile = Bun.file(linkPath);

  if (!(await linkFile.exists())) {
    return result.fail(
      new Error(
        `SETUP_PROJECT_LINK_MISSING: Vercel reported success, but ${relativeLinkPath} does not exist. Run "vercel link" from ${relativeDirectory} and confirm the intended ${appName} project.`
      )
    );
  }

  const loaded = await result.trycatch(async () => {
    const value: unknown = await linkFile.json();
    return value;
  });

  if (!loaded.ok) {
    return result.fail(
      new Error(
        `SETUP_PROJECT_LINK_UNREADABLE: Cannot read ${relativeLinkPath}: ${loaded.error.message}. Run "vercel link" again from ${relativeDirectory}.`
      )
    );
  }

  const parsed = projectLinkSchema.safeParse(loaded.value);

  if (!parsed.success) {
    return result.fail(
      new Error(
        `SETUP_PROJECT_LINK_INVALID: ${relativeLinkPath} does not contain a valid organization ID, project ID, and project name. Run "vercel link" again from ${relativeDirectory}.`
      )
    );
  }

  return result.pass(parsed.data);
};

/**
 * Loads both application links and rejects accidental project reuse.
 *
 * @returns Two distinct verified Vercel projects or the first link failure.
 */
const loadProjectLinks = async (): Promise<Result<ProjectLinks>> => {
  const web = await loadProjectLink("web", webDirectory);

  if (!web.ok) {
    return web;
  }

  const marketing = await loadProjectLink("marketing", marketingDirectory);

  if (!marketing.ok) {
    return marketing;
  }

  if (web.value.projectId === marketing.value.projectId) {
    return result.fail(
      new Error(
        `SETUP_PROJECT_CONFLICT: web and mkt both link to "${web.value.projectName}" (${web.value.projectId}). Relink one app to a separate Vercel project before running setup again.`
      )
    );
  }

  return result.pass({ marketing: marketing.value, web: web.value });
};

/**
 * Prints the verified application-to-project mapping before provisioning.
 *
 * @param projects - Distinct Vercel links for both applications.
 */
const printProjectLinks = (projects: ProjectLinks): void => {
  console.log("Verified Vercel project links:");
  console.table([
    {
      App: "web",
      Organization: projects.web.orgId,
      Project: projects.web.projectName,
      "Project ID": projects.web.projectId,
    },
    {
      App: "mkt",
      Organization: projects.marketing.orgId,
      Project: projects.marketing.projectName,
      "Project ID": projects.marketing.projectId,
    },
  ]);
};

/**
 * Explains a project-link failure and confirms that provisioning never began.
 *
 * @param failure - Failed link step and the steps completed before it.
 */
const printLinkFailure = (failure: PlanFailure): void => {
  console.error(
    `SETUP_LINK_FAILED: ${failure.failed.label} failed. ${failure.error}`
  );
  console.error(
    `No provider resources were created. Completed link steps: ${failure.completed.join(", ") || "none"}. Correct the project link, then run setup again.`
  );
};

/**
 * Explains a provider failure without claiming that remote state rolled back.
 *
 * @param failure - Failed provider step and the steps completed before it.
 * @param resourceNames - Every resource name the operator must inspect.
 */
const printServiceFailure = (
  failure: PlanFailure,
  resourceNames: readonly string[]
): void => {
  console.error(
    `SETUP_SERVICE_FAILED: ${failure.failed.label} failed. ${failure.error}`
  );
  console.error(
    `Completed service steps: ${failure.completed.join(", ") || "none"}. The failed command may also have changed remote state.`
  );
  console.error(
    `Do not rerun setup yet. Inspect ${resourceNames.map((name) => `"${name}"`).join(", ")} in Vercel, then finish only the missing service using the recovery steps in docs/setup.md.`
  );
};

/**
 * Prints the remaining manual connections and required application variables.
 *
 * @param names - Names of the planned provider resources.
 * @param webProject - Authenticated Vercel project that owns the services.
 * @param region - Opinionated default region selected for the services.
 * @param resendProvisioned - Whether this run included Resend provisioning.
 */
const printNextSteps = (
  names: ResourceNames,
  webProject: ProjectLink,
  region: SetupOptions["region"],
  resendProvisioned: boolean
): void => {
  const resendStatus = resendProvisioned
    ? names.resend
    : "deferred — rerun only the documented Resend command after acquiring a sending domain";

  console.log(`
Service provisioning completed for ${webProject.projectName}. Neon and Blob still require dashboard configuration.

Service status:
  • Neon: ${names.neon}
  • Blob: manual setup required as ${names.blob}
  • Resend: ${resendStatus}

Create Blob from the web project's Storage page:
  Vercel Dashboard → ${webProject.projectName} → Storage → Create Database → Blob
  • Store name: ${names.blob}
  • Access: Private
  • Region: ${region}
  • Environment-variable prefix: BLOB
  • Leave "Add a read-write token env var" unchecked

After creation, update the ${webProject.projectName} connection:
  • Environments: Development, Preview, and Production
  • Confirm the connection creates BLOB_STORE_ID and BLOB_WEBHOOK_PUBLIC_KEY
  • Confirm BLOB_READ_WRITE_TOKEN is absent

Connect Neon to the web project:
  Vercel Dashboard → Storage → ${names.neon} → Connect Project
  • Project: ${webProject.projectName}
  • Environments: Development, Preview, and Production
  • Require the resource before deployment
  • Enable Preview branching; leave Production branching off
  • Leave the environment-variable prefix empty

After connecting Neon and adding the application-owned variables, pull Development values:
  cd apps/web
  vercel env pull ../../.env.local --environment=development

Required application variables:
  BETTER_AUTH_URL, BETTER_AUTH_API_KEY, BETTER_AUTH_SECRET, and
  OAUTH_PROXY_SECRET`);
};

/**
 * Validates local prerequisites, links both applications, and provisions the
 * selected services in a recoverable order.
 *
 * @param arguments_ - Arguments passed after the setup script name.
 * @returns A process exit code describing setup success or failure.
 */
const main = async (arguments_: string[]): Promise<number> => {
  const options = parseOptions(arguments_);

  if (!options.ok) {
    console.error(options.error);
    return 1;
  }

  const resourceName = normalizeResourceName(packageJson.name);

  if (resourceName.length === 0) {
    console.error(
      "SETUP_NAME_EMPTY: The root package name must contain letters or numbers before setup can derive resource names."
    );
    return 1;
  }

  if (resourceName === templatePackageName) {
    console.error(
      `SETUP_NAME_UNCHANGED: Rename the root package in package.json before setup. "${templatePackageName}" would create placeholder resources.`
    );
    return 1;
  }

  const names = createResourceNames(resourceName);
  const longestName = names.resend;

  if (longestName.length > 128) {
    console.error(
      `SETUP_NAME_TOO_LONG: "${longestName}" is ${longestName.length} characters; Vercel resource names support at most 128. Shorten the root package name before running setup.`
    );
    return 1;
  }

  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    console.error(
      'SETUP_INTERACTIVE_REQUIRED: This setup creates cloud resources and requires an interactive terminal for Vercel prompts. Run "bun run setup:services" directly in a terminal.'
    );
    return 1;
  }

  const vercel = Bun.which("vercel");

  if (vercel === null) {
    console.error(
      'VERCEL_CLI_NOT_FOUND: Install Vercel CLI with "bun add --global vercel", then run setup again.'
    );
    return 1;
  }

  const linkPlan = createLinkPlan();
  printPlan("Linking both apps before provisioning resources.", linkPlan);

  const linkResult = await runPlan(vercel, linkPlan);

  if (!linkResult.ok) {
    printLinkFailure(linkResult);
    return linkResult.exitCode;
  }

  const projects = await loadProjectLinks();

  if (!projects.ok) {
    console.error(projects.error.message);
    console.error("No provider resources were created.");
    return 1;
  }

  printProjectLinks(projects.value);

  const servicePlan = createServicePlan(
    names,
    options.value,
    projects.value.web.orgId
  );
  printPlan(
    `Provisioning Neon in ${options.value.region} and any requested integrations.`,
    servicePlan
  );

  const serviceResult = await runPlan(vercel, servicePlan);

  if (!serviceResult.ok) {
    printServiceFailure(
      serviceResult,
      servicePlan.map((step) => step.resourceName)
    );
    return serviceResult.exitCode;
  }

  printNextSteps(
    names,
    projects.value.web,
    options.value.region,
    options.value.resendDomain !== undefined
  );
  return 0;
};

if (import.meta.path === Bun.main) {
  process.exitCode = await main(Bun.argv.slice(2));
}
