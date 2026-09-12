# Default web foundation setup

This runbook establishes the two-project deployment shape without blurring ownership: `web` is the authenticated product and owns Neon, Drizzle, Better Auth, private Blob storage, and Resend; `mkt` is public marketing and remains free of those dependencies. The repository steps below are current local contracts. Cloud sections distinguish configuration verified through the live Vercel/Neon setup from behavior that still requires a real deployment.

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
BLOB_READ_WRITE_TOKEN=local-verification-blob-token
OAUTH_PROXY_SECRET=local-verification-secret-not-for-production-0002
```

## Guided service setup

Before setup, replace the root `package.json` name with the minted product's slug. The script rejects the unchanged `vercel-monorepo-template` placeholder so it cannot create permanently misnamed resources.

Run setup directly in an interactive terminal. It immediately applies the opinionated cloud steps and can create resources and provider charges; non-interactive execution is rejected before any Vercel command runs:

```bash
bun run setup:services
# Provision Resend when the product owns a sending domain:
bun run setup:services --resend-domain=mail.example.com
# Choose another Neon and Blob region when needed:
bun run setup:services --region=fra1
```

Without `--resend-domain`, setup completes Neon and Blob and reports Resend as deferred. When the option is present, replace `mail.example.com` with a sending domain you own; Resend uses its free plan and `us-east-1` region. The accepted Neon and Blob regions are `cle1`, `iad1`, `pdx1`, `fra1`, `lhr1`, `syd1`, `sin1`, and `gru1`. Missing, repeated, unknown, and unsupported options fail before setup reaches Vercel.

The command first links both apps, validates their `.vercel/project.json` files, and refuses to continue if `web` and `mkt` target the same Vercel project. Only then does it provision Neon with Neon Auth disabled, create and connect a private Blob store, and, when a sending domain was supplied, install and connect Resend through the `web` project. Every provider command receives the verified `web` organization ID as its explicit Vercel scope, so a different global CLI scope cannot receive the resources. Blob and provisioned Resend resources are explicitly connected to Development, Preview, and Production.

Resource names share one cross-app convention: `neon-<package-name>-apps`, `blob-<package-name>-apps`, and `resend-<package-name>-apps`. Neon is intentionally provisioned with `--no-connect` so its required Preview branching options remain available in Vercel's **Connect Project** form. The command then tells you how to connect Neon and pull Development variables; it does not pause or pull environment variables prematurely.

Vercel retains any interactive billing and provider-consent prompts. The command stops on the first failure without deleting resources already created. The sections below are the manual equivalent, recovery path, and audit checklist for the resulting configuration.

### Why Resend may be deferred

A Vercel project link identifies the target project and organization, but it does not establish a Resend sending identity. [Vercel automatically assigns](https://vercel.com/docs/domains/working-with-domains) a shared `<project>.vercel.app` hostname, while [Resend requires](https://resend.com/docs/dashboard/domains/introduction) a domain the sender owns and can verify through DNS. Even after a custom domain is attached, a project may contain several domains, so the CLI does not guess which one should carry the product's email reputation.

Keep the Resend SDK and API-key environment contract in the minted application. Once the product owns a domain and can add its SPF and DKIM records, run only the individual Resend command below with that explicit domain; do not rerun the full setup after Neon or Blob already exists. The product chooses its sender addresses when it implements email flows.

## Recovering from an interrupted setup

If either project-link step fails, no provider resource command has run. Correct the failed link and run setup again.

If Neon, Blob, or a requested Resend installation fails, do not immediately rerun the complete setup. The failed command may have changed remote state before returning an error, while earlier service steps are known to have completed. Record the completed steps printed by the script, then inspect the named resources:

```bash
vercel integration list --all
vercel blob list-stores
```

If a named resource exists, do not recreate it; connect or finish configuring it from Vercel's Storage dashboard. If it does not exist, run only the failed creation command printed by the script, then finish the remaining provider operations individually. Rerun the full setup only after confirming that none of the resources named in its plan exists.

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

## Why this template does not use Vercel Services

Vercel Services deploy multiple runtimes atomically in one project and expose them on one deployment domain under route prefixes. This template instead contains two peer Next.js applications intended for separate domains and independent deployment/rollback lifecycles. Keeping `web` and `mkt` as separate Vercel projects is therefore the opinionated default; add a Services `vercel.json` only when a minted product explicitly wants one shared domain and atomic releases.

## Separate Vercel links for web and mkt

**Cloud mutation / manual confirmation required.** Link each app directory to a different, already-confirmed Vercel project. These commands create ignored app-local `.vercel/project.json` metadata and can prompt to create or select a project; do not use unattended confirmation flags.

```bash
(cd apps/web && vercel link)
(cd apps/mkt && vercel link)
```

Confirm the selected team and project name in each prompt before continuing. `web` and `mkt` must never share a Vercel project or root directory.

## Neon on web only

**Cloud mutation / billing and consent pause.** Connect one Neon resource to the `web` Vercel project only. Do not install or connect Neon for `mkt`.

Name shared cloud resources `<provider>-<package-name>-apps`, matching the repository's `apps/` nomenclature. For ShareFits these are `neon-sharefits-apps`, `blob-sharefits-apps`, and `resend-sharefits-apps`.

Use the Vercel/Neon integration flow only after confirming its billing, data-sharing, team, and project screens. The verified CLI shape is:

```bash
(cd apps/web && vercel integration add neon \
  --name neon-<package-name>-apps \
  --plan free_v3 \
  --metadata region=iad1 \
  --metadata auth=false \
  --no-connect \
  --scope <web-org-id>)
```

Choose the region intentionally rather than copying `iad1` when another deployment region is required. `--no-connect` also skips the automatic environment pull. After provisioning, connect Neon to `web` from the resource's **Projects** tab using the environment and branching settings below.

Keep Neon Auth disabled: this template owns authentication through Better Auth, and enabling Neon Auth provisions a separate auth system and extra environment variables. Neon Auth cannot be disabled on an existing resource through the current Vercel resource editor, so verify this choice before provisioning.

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
- `BETTER_AUTH_API_KEY`: a Better Auth Infrastructure API key used by Dash. Create it in the Better Auth Infrastructure dashboard and scope it to the intended project.
- `BETTER_AUTH_SECRET`: at least 32 characters; generate an independent value for each environment.
- `OAUTH_PROXY_SECRET`: at least 32 characters; use one identical shared value in every Development, Preview, and Production environment that participates in OAuth Proxy.

Generate secrets in an approved secret-management workflow. This local command emits a candidate secret but does not store it; do not paste its output into source control or a transcript:

```bash
openssl rand -base64 48
```

Confirm the canonical production origin, Better Auth Infrastructure project, provider callback requirements, sending domain, data-sharing implications, and target environments before saving secrets.

## Root .env.local pull

**External command that writes local secrets.** After linking `web` and configuring all required `web` variables above, pull Development values into the repository-root `.env.local`; do not create an app-local environment file.

```bash
(cd apps/web && vercel env pull ../../.env.local --environment=development)
```

This command intentionally uses the `web` project link while writing at the repository root. Keep `.env.local` private and uncommitted. Inspect the pulled keys without printing their values before running `web` scripts.

## Drizzle baseline and product migrations

The template ships a reviewed baseline migration for its complete Better Auth schema and indexes. Run these commands from the repository root after `.env.local` contains the verified unpooled Development URL:

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web db:check
# Apply only after confirming the URL points to an approved non-production branch.
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web db:migrate
```

When a product changes the schema, regenerate Better Auth's schema first, generate a new Drizzle migration, review the SQL and snapshot, run `db:check`, and apply it to an approved non-production branch before production.

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

## Better Auth defaults and schema regeneration

The web foundation enables Username, Anonymous, Passkey, Two-Factor Authentication, API Key, Organization, and OpenAPI by default. Admin, Last Login Method, OAuth Proxy, Infrastructure Dash, and Next Cookies remain enabled as well. The browser client installs every corresponding client plugin.

The template does not enable email/password authentication or choose verification, reset, organization-invitation, or email-OTP behavior. Better Auth Infrastructure provides typed email delivery backed by its hosted templates when a product chooses to wire those flows. Username normalization and validation match ShareFits: lowercase, trimmed, 1–30 characters, ASCII letters/numbers/periods/underscores, with no leading, trailing, or consecutive periods.

The Vercel runtime registers Better Auth background work with `waitUntil`. The generated schema includes the documented lookup indexes for sessions, accounts, verification identifiers, API keys, organization membership/invitations, passkeys, and two-factor records. OpenAPI's interactive reference is available at `/api/auth/reference`.

Dash activity tracking is enabled with its default five-minute update interval, so `lastActiveAt` remains in the generated `auth.user` schema. Next.js Proxy remains a product choice until a product defines protected routes.

Provider support remains a product decision. Before adding one, confirm its OAuth consent, data-sharing, callback URLs, and environment-variable requirements.

1. Add a provider or shared schema-affecting plugin to `lib/auth/auth-plugins.ts` and its server-only environment validation; do not add provider SDKs or credentials to `mkt` or `packages/ui`.
2. Ensure the shared plugin factory remains consumed by both runtime auth and `db/schema/auth-config.ts`. Do not duplicate the plugin list.
3. Regenerate and review the schema, then generate a migration:

   ```bash
   PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web auth:schema
   PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web db:generate
   PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run --cwd apps/web db:check
   ```

4. Commit the reviewed schema and product migration. Apply it to an approved non-production target and prove the provider callback before any production mutation.

## Blob and Resend on web only

The guided setup always creates a private Blob store and installs the Resend marketplace integration only when `--resend-domain` is supplied. Vercel injects `BLOB_READ_WRITE_TOKEN`; when both `VERCEL_OIDC_TOKEN` and `BLOB_STORE_ID` are available, the file service prefers those auto-rotating OIDC credentials instead. `RESEND_API_KEY` is optional until Resend is provisioned, at which point Vercel injects it. None of these variables belongs in `mkt`.

The equivalent individual creation commands are:

```bash
(cd apps/web && vercel blob create-store blob-<package-name>-apps \
  --access private \
  --region iad1 \
  --environment development \
  --environment preview \
  --environment production \
  --scope <web-org-id>)

(cd apps/web && vercel integration add resend \
  --name resend-<package-name>-apps \
  --plan free \
  --metadata domain=<sending-domain> \
  --metadata region=us-east-1 \
  --environment development \
  --environment preview \
  --environment production \
  --no-env-pull \
  --scope <web-org-id>)
```

These commands create resources. Use them during recovery only after the resource listings confirm that the corresponding name does not already exist.

`lib/files/files-service.ts` supplies the provider-neutral Files SDK surface with deterministic, create-only keys, signed private reads, and constrained browser-direct uploads. It leaves product object paths, authorization, and per-use-case upload limits to the caller. `lib/email/resend.ts` exports the server-only Resend client without inventing an email-delivery abstraction. Better Auth Infrastructure's typed `sendEmail` API and hosted templates remain available for auth email flows.

## Production gate

**Production mutation requires explicit target confirmation.** Do not run a production migration or deploy merely because local checks pass. Before authorizing production:

1. Confirm the exact Vercel team, `web` project, production branch, and Neon primary branch.
2. Re-run local checks and the `web` build with the intended environment.
3. Confirm the product migration first succeeded in a non-production environment.
4. Prove a Preview deployment received isolated Neon URLs and the observed auth health response.
5. Review provider, billing, and OAuth consent implications.
6. Only then apply the production migration/deployment through the confirmed provider flow.

Disposable `foobar` validation confirmed separate `web` and `mkt` projects under one organization, explicit provider scoping through the linked `web` organization ID, unconnected Neon creation in that organization, and private Blob connection to Development, Preview, and Production. It also confirmed that the current Resend CLI requires explicit `domain` and `region` metadata; Resend was not provisioned because the disposable app had no owned domain. The validation did not connect Neon, apply a product migration, or deploy a Preview. Treat those product-specific gates as unproven until the minted workspace records its own evidence.
