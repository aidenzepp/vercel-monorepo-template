# Default Web Foundation Design

## Objective

Turn this repository from an empty-app generator template into a ready-to-configure personal monorepo with two Next.js applications and shared foundations. The repository should be useful immediately after cloning without inventing the same Shadcn, environment, database, authentication, provider, and Vercel structure again.

This work sets up the applications; it does not design product screens or enable product-specific authentication providers.

## Delivery Strategy

Implement the foundation in small, independently verified stages. Each stage is kept only after its relevant format, lint, type, test, and build checks pass. External Vercel and Neon configuration happens after the repository-only foundation is green, and the resulting variable names and branch behavior are verified against the live integrations before documentation is finalized.

Local commits record confirmed stages. Nothing is pushed, deployed to production, or connected to a billable or consent-gated external resource without confirming the exact remote target and handling any action-time approval.

## Repository Shape

```text
apps/
  mkt/                  # Public marketing site
  web/                  # Authenticated full-stack product application
packages/
  t3-env/
    presets/
      neon              # Prefix-aware Neon-for-Vercel preset
  ui/
    src/
      components/       # Complete shared Shadcn component set
      next/             # Next.js-specific shared components
docs/
  setup.md              # Command-first setup and verification runbook
```

The existing `packages/utils` and `packages/typescript-config` remain. Imports use package subpaths rather than barrel files.

## Generator Removal

Remove the Next.js generator, its root script, and the `generate-next-app` repository skill. Update the root README and `AGENTS.md` so they describe the checked-in `web` and `mkt` applications rather than an empty `apps/` directory.

The reusable onboarding surface is `docs/setup.md`, not a generator or a setup skill.

## Shared UI

Create `@workspace/ui` from Shadcn preset `b1au7YYAk`. Install every Shadcn component into the package once. Both applications consume the same component source, theme tokens, global styles, utilities, hooks, and dependencies through direct package subpaths.

Store framework-neutral components under `packages/ui/src/components`. Store the existing reusable async and error boundaries under `packages/ui/src/next`, exported through paths such as:

```text
@workspace/ui/next/async-boundary
@workspace/ui/next/error-boundary
```

No separate async-boundary test suite is required. Its proof is successful typechecking and use by the applications.

## Applications

Create `apps/web` and `apps/mkt` with the same Shadcn preset and shared UI package. Each app has a README that states its purpose and scope.

Both root layouts:

- import the shared global styles;
- mount the shared theme provider;
- mount Vercel Analytics;
- mount Vercel Speed Insights.

`mkt` remains a marketing-only application with no database or authentication dependencies.

`web` owns the database, Drizzle schema and migrations, Better Auth configuration, auth client, and Better Auth API route. Its production build uses `next build --webpack` unless a verified current Next.js build proves the workaround is no longer necessary.

## Prefix-Aware T3 Env Package

Keep T3 Env's upstream `vercel()` preset for Vercel system variables. Add a reusable Neon preset at `@workspace/t3-env/presets/neon` rather than copying the upstream preset into `apps/web`.

The preset accepts a literal environment-variable prefix and mirrors Vercel's prefix behavior:

- prepend the prefix to each Neon secret name;
- do not duplicate a prefix when the original name already starts with it;
- expose the actual injected variable names to the consuming T3 Env schema.

For example:

```text
prefix DATABASE_
DATABASE_URL           -> DATABASE_URL
PGDATABASE             -> DATABASE_PGDATABASE

prefix STORAGE_
DATABASE_URL           -> STORAGE_DATABASE_URL
DATABASE_URL_UNPOOLED  -> STORAGE_DATABASE_URL_UNPOOLED
PGDATABASE             -> STORAGE_PGDATABASE
```

The template uses `STORAGE_`. The preset includes Neon’s pooled URL as required and its unpooled and granular connection variables as optional, matching the provider contract while preserving their prefixed names. Focused preset tests prove empty, `DATABASE_`, and `STORAGE_` behavior, including the exact unpooled name.

`apps/web` extends:

```text
vercel()
neonVercel({ prefix: "STORAGE_" })
```

It adds the application-owned `BETTER_AUTH_SECRET`, `OAUTH_PROXY_SECRET`, and `NODE_ENV` variables. Turbo declares every environment variable needed by web build and development tasks.

## Neon, Drizzle, and Environments

Connect the web Vercel project to one Neon resource for Vercel Development, Preview, and Production. Use the `STORAGE_` prefix. Production uses the resource's primary branch. Enable Neon branch-per-deployment behavior for Vercel Preview deployments so each preview receives an isolated database branch and corresponding injected URLs.

The runtime connection uses the pooled URL. Drizzle migration operations use the unpooled URL and fail clearly when it has not been enabled or pulled. Drizzle scripts load the repository-root `.env.local` from `apps/web` so there is one local environment file.

The live setup stage must inspect the actual Vercel variable list and confirm:

- Development, Preview, and Production receive the intended variables;
- `STORAGE_DATABASE_URL` is the pooled connection;
- `STORAGE_DATABASE_URL_UNPOOLED` is the direct connection;
- a real preview deployment receives a Neon preview branch;
- the preview branch does not point at the production connection.

If the provider's live contract differs, change the preset and documentation to the observed contract before retaining that stage.

## Better Auth Foundation

Configure Better Auth in `web` without enabling a login provider by default. Include:

- Drizzle adapter;
- generated core Better Auth tables in the Postgres `auth` schema;
- a committed Drizzle migration;
- relation joins;
- OAuth token encryption;
- OAuth Proxy support;
- Next.js cookie integration;
- server and client modules;
- the Better Auth catch-all API route.

Do not enable Google, Apple, TimeBack, or other providers in the template. `docs/setup.md` explains how to add a provider and regenerate the schema when a provider or plugin changes the Better Auth contract.

## Optional Resend Integration

Resend is not installed or configured by default. `docs/setup.md` includes an optional section covering Vercel Marketplace provisioning, environment variables, domains, and verification. Adding Resend to a minted product remains a deliberate product decision.

## Setup Documentation

`docs/setup.md` is a command-first runbook covering:

1. install and local checks;
2. link `apps/web` and `apps/mkt` to separate Vercel projects;
3. create or connect Neon to `web` for all three Vercel environments;
4. select `STORAGE_`, enable the pooled and unpooled URLs, and enable Preview branching;
5. pull Development variables into the root `.env.local`;
6. generate Better Auth and OAuth Proxy secrets safely;
7. run the committed Drizzle migration;
8. deploy and inspect a Preview environment and its Neon branch;
9. configure a login provider when the product needs one;
10. optionally configure Resend.

The instructions identify which commands are read-only, which mutate cloud state, and where billing, OAuth, data-sharing, or consent screens require confirmation.

## Verification

Repository-only verification runs before cloud setup:

- format and lint;
- root and workspace typechecks;
- focused prefix-aware Neon preset tests;
- production builds for both applications;
- compile-time verification of the Better Auth route and Drizzle configuration;
- confirmation that the generator command, files, skill, and documentation references are absent.

Cloud verification runs only after the local foundation passes:

- both app directories link to the intended Vercel projects;
- Neon variables are present in all selected environments;
- the committed migration applies to the intended non-production target first;
- the auth API route responds on a deployed Preview;
- a Preview deployment receives an isolated Neon branch;
- production migration or deployment occurs only after the preview path is proven.

There are no dedicated async-boundary tests. Green lint or typechecking alone does not prove the external integration; the live Preview path is the acceptance test for Neon branching, environment injection, migration, and the auth route.

## Completion Criteria

The work is complete when:

- `web`, `mkt`, `ui`, and `t3-env` are checked in and green;
- both apps share the exact Shadcn preset and UI source;
- both layouts contain the shared theme provider, Analytics, and Speed Insights;
- web contains the provider-neutral Better Auth and Drizzle foundation;
- the prefix-aware Neon preset matches the variables observed from Vercel;
- Development, Preview, and Production connectivity is documented and Preview branching is proven;
- `docs/setup.md` and both app READMEs describe the verified workflow;
- the obsolete generator and its skill are gone;
- only verified commits are eligible to be pushed after the remote target is confirmed.
