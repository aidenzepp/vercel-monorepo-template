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
  ui/
    src/
      components/       # Complete shared Shadcn component set
      next/             # Next.js-specific shared components
docs/
  setup.md              # Command-first setup and verification runbook
```

The existing `packages/utils` and `packages/typescript-config` remain. Imports use package subpaths rather than barrel files.

## Generator Removal

Remove the obsolete Next.js scaffolding command, its root script, and its repository skill. Update the root README and `AGENTS.md` so they describe the checked-in `web` and `mkt` applications rather than an empty `apps/` directory.

The reusable onboarding surface is `docs/setup.md`, not a generator or a setup skill.

## Shared UI

Create `@workspace/ui` from Shadcn preset `b1au7YYAk`. Install every Shadcn component into the package once. Both applications consume the same component source, theme tokens, global styles, utilities, hooks, and dependencies through direct package subpaths.

Store framework-neutral components under `packages/ui/src/components`. Store the existing reusable async and error boundaries under `packages/ui/src/next`, exported through paths such as:

```text
@workspace/ui/next/async-boundary
@workspace/ui/next/error-boundary
```

No separate async-boundary test suite is required. No application consumer exists yet; its proof is limited to `packages/ui` typechecking.

## Applications

Create `apps/web` and `apps/mkt` with the same Shadcn preset and shared UI package. Each app has a README that states its purpose and scope.

Both root layouts:

- import the shared global styles;
- mount the shared theme provider;
- mount Vercel Analytics;
- mount Vercel Speed Insights.

`mkt` remains a marketing-only application with no database or authentication dependencies.

`web` owns the database, Drizzle schema and product migrations, Better Auth configuration, auth client, and Better Auth API route. Both applications use `next build --webpack` for production until a current Next.js/Turbopack build is proven in this environment.

## T3 Env

Keep T3 Env's upstream presets for Vercel system variables and Neon’s Vercel integration. Connect Neon without a custom environment-variable prefix so the provider contract matches `neonVercel()` directly.

`apps/web` extends:

```text
vercel()
neonVercel()
```

The resulting database contract uses `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and Neon’s standard optional `PG*` and `POSTGRES_*` variables. Web adds the application-owned `BETTER_AUTH_URL`, `BETTER_AUTH_API_KEY`, `BETTER_AUTH_SECRET`, `OAUTH_PROXY_SECRET`, and `NODE_ENV` variables. Turbo declares every environment variable needed by web build and development tasks.

## Neon, Drizzle, and Environments

Connect the web Vercel project to one Neon resource for Vercel Development, Preview, and Production without a custom variable prefix. Production uses the resource's primary branch. Enable Neon branch-per-deployment behavior for Vercel Preview deployments so each preview receives an isolated database branch and corresponding injected URLs.

The runtime connection uses the pooled URL. Drizzle migration operations use the unpooled URL and fail clearly when it has not been enabled or pulled. Drizzle scripts load the repository-root `.env.local` from `apps/web` so there is one local environment file.

The live setup stage must inspect the actual Vercel variable list and confirm:

- Development, Preview, and Production receive the intended variables;
- `DATABASE_URL` is the pooled connection;
- `DATABASE_URL_UNPOOLED` is the direct connection;
- a real preview deployment receives a Neon preview branch;
- the preview branch does not point at the production connection.

If the provider's live contract differs, change the web environment wiring and documentation to the observed contract before retaining that stage.

## Better Auth Foundation

Configure Better Auth in `web` without enabling a login provider by default. Include:

- Drizzle adapter;
- generated core Better Auth tables in the Postgres `auth` schema;
- product-owned Drizzle migration commands, with no published baseline migration;
- relation joins;
- OAuth token encryption;
- OAuth Proxy support;
- Better Auth Infrastructure Dash with activity tracking and a generated `lastActiveAt` user field;
- Better Auth Infrastructure Sentinel with browser fingerprinting and automatic challenge solving, but no product-specific enforcement policy;
- Test Utils server context helpers, with no public routes;
- Next.js cookie integration;
- server and client modules;
- the Better Auth catch-all API route.

Do not enable Google, Apple, TimeBack, or other providers in the template. Next.js Proxy remains a product choice. `docs/setup.md` explains how to provision Better Auth Infrastructure, add a provider, and regenerate the schema when a provider or plugin changes the Better Auth contract.

## Optional Resend Integration

Resend is not installed or configured by default. `docs/setup.md` includes an optional section covering Vercel Marketplace provisioning, environment variables, domains, and verification. Adding Resend to a product workspace remains a deliberate product decision.

## Setup Documentation

`docs/setup.md` is a command-first runbook covering:

1. install and local checks;
2. link `apps/web` and `apps/mkt` to separate Vercel projects;
3. create or connect Neon to `web` for all three Vercel environments;
4. leave the variable prefix empty, enable the pooled and unpooled URLs, and enable Preview branching;
5. pull Development variables into the root `.env.local`;
6. set the stable Better Auth production URL and generate Better Auth and OAuth Proxy secrets safely;
7. generate and run a product migration after the product schema is configured;
8. deploy and inspect a Preview environment and its Neon branch;
9. configure a login provider when the product needs one;
10. optionally configure Resend.

The instructions identify which commands are read-only, which mutate cloud state, and where billing, OAuth, data-sharing, or consent screens require confirmation.

## Verification

Repository-only verification runs before cloud setup:

- format and lint;
- root and workspace typechecks;
- production builds for both applications;
- compile-time verification of the Better Auth route and Drizzle configuration;
- confirmation that the generator command, files, skill, and documentation references are absent.

Cloud verification runs only after the local foundation passes:

- both app directories link to the intended Vercel projects;
- Neon variables are present in all selected environments;
- the product migration applies to the intended non-production target first;
- the auth API route responds on a deployed Preview;
- a Preview deployment receives an isolated Neon branch;
- production migration or deployment occurs only after the preview path is proven.

There are no dedicated async-boundary tests. Green lint or typechecking alone does not prove the external integration; the live Preview path is the acceptance test for Neon branching, environment injection, migration, and the auth route.

## Completion Criteria

The work is complete when:

- `web`, `mkt`, and `ui` are checked in and green;
- both apps share the exact Shadcn preset and UI source;
- both layouts contain the shared theme provider, Analytics, and Speed Insights;
- web contains the provider-neutral Better Auth and Drizzle foundation;
- the upstream `neonVercel()` preset matches the unprefixed variables observed from Vercel;
- Development, Preview, and Production connectivity is documented and Preview branching is proven;
- `docs/setup.md` and both app READMEs describe the verified workflow;
- the obsolete generator and its skill are gone;
- only verified commits are eligible to be pushed after the remote target is confirmed.
