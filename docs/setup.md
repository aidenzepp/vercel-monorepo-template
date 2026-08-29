# Default web foundation setup

This runbook establishes the two-project deployment shape without blurring ownership: `web` is the authenticated product and owns Neon, Drizzle, and Better Auth; `mkt` is public marketing and remains free of auth and database dependencies. The repository steps below are current local contracts. Cloud sections distinguish configuration verified through the live Vercel/Neon setup from behavior that still requires a real deployment.

## Prerequisites and Bun install

Use Bun 1.3.14 or the version pinned by the root `packageManager` field. This is a local dependency write, not a cloud mutation:

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun --version
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun install --frozen-lockfile
```

Run commands from the repository root unless a command explicitly changes directory. Do not add a second lockfile inside either app. `bunfig.toml` applies a six-hour minimum release age to newly resolved package versions; the committed lockfile remains authoritative for normal installs.

## Disposable local `.env.local`

Before local verification, create the ignored repository-root `.env.local` with disposable values. These URLs are syntactically valid but intentionally point to an unavailable local address, so they cannot reach a real database. Replace these values only after the cloud setup provides the confirmed `web` project values; never commit this file.

```dotenv
DATABASE_URL=postgresql://disposable:disposable@127.0.0.1:1/disposable?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://disposable:disposable@127.0.0.1:1/disposable?sslmode=require
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_API_KEY=local-verification-api-key
BETTER_AUTH_SECRET=local-verification-secret-not-for-production-0001
OAUTH_PROXY_SECRET=local-verification-secret-not-for-production-0002
```

## Local verification

These are local checks. `format` and `fix` can write files; the remaining commands should not change repository source. `web` builds require its environment variables, so complete the root `.env.local` step before its build.

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run check
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run lint
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run typecheck
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/mkt build
NODE_ENV=production PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun --env-file=../../.env.local run --cwd apps/web build
```

Both application build scripts currently use `next build --webpack`. Keep that workaround until a current Next.js/Turbopack production build is proven in this environment.

The two layouts must continue to consume the shared theme provider, Analytics, and Speed Insights. There is no dedicated async-boundary test or application consumer yet. Its current evidence is limited to `packages/ui` typechecking; do not treat application typechecks or builds as boundary proof.

## Separate Vercel links for web and mkt

**Cloud mutation / manual confirmation required.** Link each app directory to a different, already-confirmed Vercel project. These commands create ignored app-local `.vercel/project.json` metadata and can prompt to create or select a project; do not use unattended confirmation flags.

```bash
(cd apps/web && vercel link)
(cd apps/mkt && vercel link)
```

Confirm the selected team and project name in each prompt before continuing. `web` and `mkt` must never share a Vercel project or root directory.

## Neon on web only

**Cloud mutation / billing and consent pause.** Connect one Neon resource to the `web` Vercel project only. Do not install or connect Neon for `mkt`.

Name app-specific cloud resources `<project>-apps-<app>`, matching the repository's `apps/` nomenclature. Examples include `sharefits-apps-web`, `amino-apps-web`, and `vercel-monorepo-template-apps-web`.

Use the Vercel/Neon integration flow only after confirming its billing, data-sharing, team, and project screens. The verified CLI shape is:

```bash
(cd apps/web && vercel integration add neon \
  --name <project>-apps-web \
  --plan free_v3 \
  --metadata region=iad1 \
  --metadata auth=false \
  --environment development \
  --environment preview \
  --environment production \
  --no-env-pull)
```

Choose the region intentionally rather than copying `iad1` when another deployment region is required. Keep Neon Auth disabled: this template owns authentication through Better Auth, and enabling Neon Auth provisions a separate auth system and extra environment variables. Neon Auth cannot be disabled on an existing resource through the current Vercel resource editor, so verify this choice before provisioning.

The current Vercel CLI also installs Neon agent skills into the app as a provisioning side effect. Remove `apps/web/.agents/` and `apps/web/skills-lock.json` unless the minted product explicitly chooses to keep those optional skills; they are not template foundations.

## Development + Preview + Production selection

In the `web` project’s Neon integration, select all three Vercel environments:

- Development supplies local development values;
- Preview supplies deployment-specific values;
- Production supplies the production branch values.

`mkt` must not receive either database URL. Do not infer the actual environment list from this document; inspect the live project before saving.

## Empty Neon variable prefix

Leave the Neon integration variable prefix empty. The web environment contract extends upstream `neonVercel()` directly, so renaming variables or applying a custom prefix breaks the application-owned contract.

## Pooled/unpooled variable audit

**Read-only cloud check after integration.** Inspect the `web` project’s variables for every selected environment. The required contract is:

| Variable | Role | Owner |
| --- | --- | --- |
| `DATABASE_URL` | Pooled runtime connection used by the app | Neon/Vercel integration |
| `DATABASE_URL_UNPOOLED` | Direct connection used only by Drizzle Kit migration commands | Neon/Vercel integration |
| Optional `PG*` and `POSTGRES_*` values | Standard integration values, if provided | Neon/Vercel integration |

Do not swap the two URLs, expose either value to the browser, or manually substitute prefixed aliases. If `DATABASE_URL_UNPOOLED` is absent, stop before Drizzle work: `apps/web/drizzle.config.ts` intentionally fails rather than running migrations against an ambiguous connection.

## Required Preview branching configuration

Enable **Require Active Resource Before Deploy**, then enable Neon branch-per-deployment behavior for `web` Preview deployments. Leave Production branch creation off. A preview must receive an isolated branch and injected URLs rather than the production connection. This is required, not an optimization.

Disposable validation confirmed that the resource editor saves this configuration. A minted product must still prove the resulting branch and URLs in a real Preview before claiming runtime isolation.

## Better Auth application and Infrastructure variables

**Cloud mutation / secret-management pause.** Add these application-owned server variables to `web`, never `mkt`:

- `BETTER_AUTH_URL`: the stable canonical production origin. It remains stable across Development, Preview, and Production because OAuth Proxy needs the production callback origin; Better Auth separately allowlists local and Vercel preview hosts.
- `BETTER_AUTH_API_KEY`: a Better Auth Infrastructure API key used by Dash and Sentinel. Create it in the Better Auth Infrastructure dashboard and scope it to the intended project; Sentinel requires a Pro plan or above.
- `BETTER_AUTH_SECRET`: at least 32 characters; generate an independent value for each environment.
- `OAUTH_PROXY_SECRET`: at least 32 characters; use one identical shared value in every Development, Preview, and Production environment that participates in OAuth Proxy.

Generate secrets in an approved secret-management workflow. This local command emits a candidate secret but does not store it; do not paste its output into source control or a transcript:

```bash
openssl rand -base64 48
```

Confirm the canonical production origin, Better Auth Infrastructure project, provider callback requirements, data-sharing implications, and target environments before saving secrets. No sign-in provider is enabled by default.

## Root .env.local pull

**External command that writes local secrets.** After linking `web` and configuring all required `web` variables above, pull Development values into the repository-root `.env.local`; do not create an app-local environment file.

```bash
(cd apps/web && vercel env pull ../../.env.local --environment=development)
```

This command intentionally uses the `web` project link while writing at the repository root. Keep `.env.local` private and uncommitted. Inspect the pulled keys without printing their values before running `web` scripts.

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

**Cloud mutation / unverified deployment step.** Create a `web` Preview only after verifying the Vercel project, branch, and Neon Preview configuration:

```bash
(cd apps/web && vercel)
```

**Read-only remote probe after deployment.** Record the preview URL, inspect its injected connection details through approved provider surfaces, and probe the auth handler without credentials:

```bash
curl --include "$PREVIEW_URL/api/auth/ok"
```

The local handler returns `200 {"ok":true}`. Capture the remote response and prove that the deployment used an isolated Neon Preview branch rather than the production URL.

## Provider addition and auth schema regeneration

Provider support is a product decision and belongs only in `web`. Before adding a provider or schema-affecting Better Auth plugin, confirm its OAuth consent, data-sharing, callback URLs, and environment-variable requirements.

The foundation's production auth server and browser client include Better Auth Admin, Last Login Method, Dash, and Sentinel. Dash activity tracking is enabled with its default five-minute update interval, so `lastActiveAt` is generated into the `auth.user` schema before a product creates its baseline migration. Dash provides the hosted audit and activity surface; its browser client exposes the matching query APIs. Sentinel's browser client supplies visitor identification and automatically solves proof-of-work challenges, while the server intentionally leaves product-specific log, challenge, and block policies unset. The small Sentinel initialization adapter preserves Better Auth's request-resolved base URLs for local and Vercel Preview hosts while giving Sentinel the canonical fallback it currently requires during startup. Last Login Method remains cookie-backed and adds no database field. Test Utils exposes privileged server context helpers but no public routes; the browser client does not include it. Next.js Proxy remains a product choice until a product defines protected routes.

1. Add the provider or plugin to the web auth configuration and its server-only environment validation; do not add provider SDKs or credentials to `mkt` or `packages/ui`.
2. Update `db/schema/auth-config.ts` when the provider/plugin changes Better Auth’s generated schema contract. Dash activity tracking is already represented there so `lastActiveAt` remains in every regenerated schema.
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

Disposable validation confirmed the project-link shape, Neon creation command, unprefixed variable contract, three-environment connection, and saved Preview-branching configuration. It did not apply a product migration or deploy a Preview. Treat those product-specific gates as unproven until the minted workspace records its own evidence.
