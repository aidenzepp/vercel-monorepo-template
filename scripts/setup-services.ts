import { spawnSync } from "node:child_process";
import path from "node:path";

import packageJson from "../package.json" with { type: "json" };

const repositoryRoot = path.resolve(import.meta.dirname, "..");

const apply = process.argv.includes("--apply");
const regionArgument = process.argv.find((argument) =>
  argument.startsWith("--region=")
);
const requestedRegion = regionArgument?.slice("--region=".length) ?? "iad1";
const packageName = packageJson.name.split("/").at(-1) ?? "app";
const resourceName = packageName
  .toLowerCase()
  .replaceAll(/[^a-z0-9-]/gu, "-")
  .replaceAll(/-+/gu, "-")
  .replaceAll(/^-|-$/gu, "");

if (!/^[a-z]{3}\d$/u.test(requestedRegion)) {
  console.error(
    `Invalid region "${requestedRegion}". Use a Vercel region such as iad1 or sfo1.`
  );
  process.exit(1);
}

if (!resourceName) {
  console.error(
    "The root package name must contain letters or numbers before setup can derive cloud resource names."
  );
  process.exit(1);
}

const webDirectory = path.resolve(repositoryRoot, "apps/web");
const marketingDirectory = path.resolve(repositoryRoot, "apps/mkt");

const plan = [
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
      `region=${requestedRegion}`,
      "--metadata",
      "auth=false",
      "--environment",
      "development",
      "--environment",
      "preview",
      "--environment",
      "production",
      "--no-env-pull",
    ],
    directory: webDirectory,
    label: "Provision and connect Neon to web",
  },
  {
    arguments: [
      "blob",
      "create-store",
      `${resourceName}-apps-web`,
      "--access",
      "private",
      "--region",
      requestedRegion,
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
    arguments: [
      "env",
      "pull",
      "../../.env.local",
      "--environment",
      "development",
    ],
    directory: webDirectory,
    label: "Pull web Development variables to the repository root",
  },
  {
    arguments: ["link"],
    directory: marketingDirectory,
    label: "Link the database-free marketing app to its Vercel project",
  },
];

console.log(
  `${apply ? "Applying" : "Previewing"} the opinionated service setup for ${resourceName} in ${requestedRegion}.`
);

for (const [index, step] of plan.entries()) {
  console.log(`\n${index + 1}. ${step.label}`);
  console.log(`   cwd: ${step.directory}`);
  console.log(`   vercel ${step.arguments.join(" ")}`);

  if (!apply) {
    continue;
  }

  const execution = spawnSync("vercel", step.arguments, {
    cwd: step.directory,
    stdio: "inherit",
  });

  if (execution.error) {
    console.error(`Could not run Vercel CLI: ${execution.error.message}`);
    process.exit(1);
  }

  if (execution.status !== 0) {
    console.error(
      `Setup stopped at step ${index + 1}. Resolve the Vercel prompt or error, then rerun the command; completed resources are left intact.`
    );
    process.exit(execution.status ?? 1);
  }
}

if (apply) {
  console.log(
    "\nProvisioning completed. Add APP_NAME, BETTER_AUTH_URL, BETTER_AUTH_SECRET, OAUTH_PROXY_SECRET, and RESEND_FROM_EMAIL to the web project before building."
  );
} else {
  console.log(
    "\nNo cloud resources were changed. Run `bun run setup:services --apply` after reviewing the project, team, region, and billing prompts."
  );
}
