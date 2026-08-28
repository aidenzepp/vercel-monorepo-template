# Default web foundation setup

This runbook establishes the two-project deployment shape without blurring ownership: `web` is the authenticated product and owns Neon, Drizzle, and Better Auth; `mkt` is public marketing and remains free of auth and database dependencies. The repository steps below are current local contracts. Vercel, Neon, OAuth, and Resend instructions are intentionally provisional until the live integration pass records their observed CLI and dashboard behavior.

## Prerequisites and Bun install

Use Bun 1.3.14 or the version pinned by the root `packageManager` field. This is a local dependency write, not a cloud mutation:

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun --version
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun install
```

Run commands from the repository root unless a command explicitly changes directory. Do not add a second lockfile inside either app.

## Local verification

These are local checks. `format` and `fix` can write files; the remaining commands should not change repository source. `web` builds require its environment variables, so complete the root `.env.local` step before its build.

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run check
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run lint
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run typecheck
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/mkt build
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web build
```

Both application build scripts currently use `next build --webpack`. Keep that workaround until a current Next.js/Turbopack production build is proven in this environment.

The two layouts must continue to consume the shared theme provider, Analytics, and Speed Insights. There is no dedicated async-boundary test or application consumer yet. Its current evidence is limited to `packages/ui` typechecking; do not treat application typechecks or builds as boundary proof.

## Separate Vercel links for web and mkt

**Provisional cloud mutation / manual confirmation required.** Link each app directory to a different, already-confirmed Vercel project. The commands below may create local link metadata and can prompt to create or select a project; do not use unattended confirmation flags. Task 8 must verify the installed CLI’s exact prompts and resulting metadata.

```bash
(cd apps/web && vercel link)
(cd apps/mkt && vercel link)
```

Confirm the selected team and project name in each prompt before continuing. `web` and `mkt` must never share a Vercel project or root directory.

## Neon on web only

**Provisional cloud mutation / billing and consent pause.** Connect one Neon resource to the `web` Vercel project only. Do not install or connect Neon for `mkt`.

Use the Vercel/Neon integration flow only after confirming its billing, data-sharing, team, and project screens. The intended configuration is one resource selected for Development, Preview, and Production; production uses its primary branch. Task 8 must confirm the live navigation and any exact CLI equivalent before this section becomes a verified procedure.

## Development + Preview + Production selection

**Provisional cloud mutation.** In the `web` project’s Neon integration, select all three Vercel environments:

- Development supplies local development values;
- Preview supplies deployment-specific values;
- Production supplies the production branch values.

`mkt` must not receive either database URL. Do not infer the actual environment list from this document; inspect the live project before saving.

## Empty Neon variable prefix

**Provisional cloud mutation.** Leave the Neon integration variable prefix empty. The web environment contract extends upstream `neonVercel()` directly, so renaming variables or applying a custom prefix breaks the application-owned contract.

## Pooled/unpooled variable audit

**Read-only cloud check after integration.** Inspect the `web` project’s variables for every selected environment. The required contract is:

| Variable | Role | Owner |
| --- | --- | --- |
| `DATABASE_URL` | Pooled runtime connection used by the app | Neon/Vercel integration |
| `DATABASE_URL_UNPOOLED` | Direct connection used only by Drizzle Kit migration commands | Neon/Vercel integration |
| Optional `PG*` and `POSTGRES_*` values | Standard integration values, if provided | Neon/Vercel integration |

Do not swap the two URLs, expose either value to the browser, or manually substitute prefixed aliases. If `DATABASE_URL_UNPOOLED` is absent, stop before Drizzle work: `apps/web/drizzle.config.ts` intentionally fails rather than running migrations against an ambiguous connection.

## Required Preview branching configuration

**Provisional cloud mutation.** Enable Neon branch-per-deployment behavior for `web` Preview deployments. A preview must receive an isolated branch and injected URLs rather than the production connection. This is required, not an optimization.

Task 8 must prove the resulting branch and URLs with a real preview before this contract is marked verified. Until then, do not claim that a preview is isolated merely because the integration screen was saved.

## BETTER_AUTH_URL, BETTER_AUTH_SECRET, OAUTH_PROXY_SECRET

**Cloud mutation / secret-management pause.** Add these application-owned server variables to `web`, never `mkt`:

- `BETTER_AUTH_URL`: the stable canonical production origin. It remains stable across Development, Preview, and Production because OAuth Proxy needs the production callback origin; Better Auth separately allowlists local and Vercel preview hosts.
- `BETTER_AUTH_SECRET`: at least 32 characters; used to secure Better Auth.
- `OAUTH_PROXY_SECRET`: at least 32 characters; used by Better Auth’s OAuth Proxy plugin.

Generate secrets in an approved secret-management workflow. This local command emits a candidate secret but does not store it; do not paste its output into source control or a transcript:

```bash
openssl rand -base64 48
```

Confirm the canonical production origin, provider callback requirements, and target environments before saving secrets. No sign-in provider is enabled by default.

## Root .env.local pull

**Provisional external command that writes local secrets.** After linking `web` and configuring all required `web` variables above, pull Development values into the repository-root `.env.local`; do not create an app-local environment file.

```bash
(cd apps/web && vercel env pull ../../.env.local --environment=development)
```

The exact `vercel env pull` flags and output are pending live verification. This command intentionally uses the `web` project link while writing at the repository root. Keep `.env.local` private and uncommitted. Inspect the pulled keys without printing their values before running `web` scripts.

## Drizzle checks and product migrations

Run these from the repository root after the root `.env.local` contains the verified unpooled URL. This template publishes no migrations, so do not run `db:check` in the pristine template: Drizzle Kit can create empty journal scaffolding and validates migration snapshots only after they exist. Once a real product schema is ready, generate the baseline, review it, validate it, commit the schema and migration, then apply it only to an approved non-production target.

```bash
# 1. Generate the product baseline migration.
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web db:generate
# 2. Review the generated baseline migration.
# 3. Validate its migration snapshots.
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web db:check
```

4. Commit the reviewed schema and migration.
5. Run `db:migrate` only against an approved non-production target.

`build:vercel` runs only `next build --webpack`. A product may add `db:migrate` before its build only after it has generated, reviewed, and applied a product migration in an approved non-production target; do not enable that deployment path until the preview migration path has been observed and approved.

## Preview deployment and auth health probe

**Provisional cloud mutation.** Create a `web` preview deployment only after verifying the Vercel project, branch, and Neon Preview configuration. The unconfirmed CLI form is:

```bash
(cd apps/web && vercel)
```

**Read-only remote probe after deployment.** Record the preview URL, inspect its injected connection details through approved provider surfaces, and probe the auth handler without credentials:

```bash
curl --include "$PREVIEW_URL/api/auth/ok"
```

The expected status/body for this handler is deliberately not asserted yet. Task 8 must capture the observed response and prove that the deployment used an isolated Neon preview branch rather than the production URL.

## Provider addition and auth schema regeneration

Provider support is a product decision and belongs only in `web`. Before adding a provider or schema-affecting Better Auth plugin, confirm its OAuth consent, data-sharing, callback URLs, and environment-variable requirements.

The foundation's production auth server and browser client include Better Auth Admin and Last Login Method. Admin's fields are generated into the `auth` schema and require the regeneration workflow below. Last Login Method is cookie-backed by default, so it adds no database field. The server config also includes Test Utils: it exposes privileged server context helpers but adds no public routes; the browser client does not include it. Next.js Proxy, `dash()`, `dashClient()`, and hosted audit infrastructure remain product choices, to be added only after a product defines its protected routes and audit requirements.

1. Add the provider or plugin to the web auth configuration and its server-only environment validation; do not add provider SDKs or credentials to `mkt` or `packages/ui`.
2. Update `db/schema/auth-config.ts` when the provider/plugin changes Better Auth’s generated schema contract.
3. Regenerate and review the schema, then generate a migration:

   ```bash
   PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web auth:schema
   PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web db:generate
   PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web db:check
   ```

4. Commit the reviewed schema and product migration. Apply it to an approved non-production target and prove the provider callback before any production mutation.

## Optional Resend

**Optional cloud mutation / billing, domain, and consent pause.** Resend is intentionally not installed or configured by this foundation. If a product needs email, provision it through the Vercel Marketplace or the chosen provider only after reviewing billing, sender domain ownership, and verification requirements. Add the dependency, server-only variables, domain configuration, and tests inside `web`; do not make it a shared or marketing dependency by default.

## Production gate

**Production mutation requires explicit target confirmation.** Do not run a production migration or deploy merely because local checks pass. Before authorizing production:

1. Confirm the exact Vercel team, `web` project, production branch, and Neon primary branch.
2. Re-run local checks and the `web` build with the intended environment.
3. Confirm the product migration first succeeded in a non-production environment.
4. Prove a Preview deployment received isolated Neon URLs and the observed auth health response.
5. Review provider, billing, and OAuth consent implications.
6. Only then apply the production migration/deployment through the confirmed provider flow.

Task 8 is responsible for replacing the provisional cloud command details with live, evidence-backed behavior. Until that work is complete, this guide is a safe configuration target rather than evidence that any cloud resource is linked, deployed, or healthy.
