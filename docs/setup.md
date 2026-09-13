# Default web foundation setup

This runbook establishes the two-project deployment shape without blurring ownership: `web` is the authenticated product and owns Neon, Drizzle, Better Auth, public Blob storage, and Resend; `mkt` is public marketing and remains free of those dependencies. The repository steps below are current local contracts. Cloud sections distinguish configuration verified through the live Vercel/Neon setup from behavior that still requires a real deployment.

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
BLOB_STORE_ID=store_local-verification
BLOB_WEBHOOK_PUBLIC_KEY=local-verification-webhook-public-key
OAUTH_PROXY_SECRET=local-verification-secret-not-for-production-0002
RESEND_API_KEY=re_local-verification
RESEND_EMAIL_DOMAIN=example.com
```

These placeholders support static checks and local builds only. They do not authorize database, Blob, email, or Better Auth Infrastructure operations.

## Cloud setup

Cloud resources are configured deliberately through Vercel and their provider dashboards. There is no all-in-one provisioning command: project ownership, Neon branching, Blob OIDC, sending-domain verification, environments, billing, and consent must remain visible and reviewable.

Before creating resources, replace the root `package.json` name with the minted product's slug. Shared resources follow one naming convention:

- `neon-<package-name>-apps`
- `blob-<package-name>-apps`
- `resend-<package-name>-apps`

Use `iad1` as the default Neon and Blob region unless the product's deployment or data-residency requirements justify another region. Configure the cloud foundation in this order:

1. Create separate Vercel projects for `apps/web` and `apps/mkt`, then link each local app to its project.
2. Create and connect Neon only to `web`, with Neon Auth disabled and Preview branching enabled.
3. Create and connect a public Blob store only to `web`, using OIDC without a read-write token.
4. Install Resend only after the product owns a sending domain and can verify its DNS records.
5. Add the application-owned Better Auth variables to `web`.
6. Pull the completed Development environment into the repository-root `.env.local`.
7. Apply the baseline migration to a confirmed non-production Neon branch and prove a Preview deployment before production.

The sections below define each choice and its verification criteria. If setup is interrupted, inspect the live project and provider dashboards before continuing; do not create another resource with the same intended role merely because an earlier browser flow did not visibly finish.

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

**Cloud mutation / manual confirmation required.** Import the repository into Vercel twice. Create `<package-name>-web` with **Root Directory** set to `apps/web`, then create `<package-name>-mkt` with **Root Directory** set to `apps/mkt`. Keep both projects under the same intended Vercel team, but do not make either project own the repository root.

Attach the authenticated product domain, such as `app.example.com`, only to `web`. Attach the public apex and `www` domains only to `mkt`. Confirm any redirect between the apex and `www` hostnames in Vercel's Domains screen rather than assuming one.

After both remote projects exist, link each local app directory to its corresponding project. These commands create ignored app-local `.vercel/project.json` metadata; select the existing project and do not use unattended confirmation flags.

```bash
(cd apps/web && vercel link)
(cd apps/mkt && vercel link)
```

Confirm the selected team and project name in each prompt before continuing. `web` and `mkt` must never share a Vercel project or root directory.

## Neon on web only

**Cloud mutation / billing and consent pause.** Connect one Neon resource to the `web` Vercel project only. Do not install or connect Neon for `mkt`.

From the `web` project's **Storage** page, choose **Create Database**, select Neon, and review the provider's plan, billing, data-sharing, team, and project screens. Name the resource `neon-<package-name>-apps`, use the free plan, and choose `iad1` unless the product requires another region. After creating the resource, open its **Projects** tab and connect only the `web` project using the environment and branching settings below.

Keep Neon Auth disabled: this template owns authentication through Better Auth, and enabling Neon Auth provisions a separate auth system and extra environment variables. Neon Auth cannot be disabled on an existing resource through the current Vercel resource editor, so verify this choice before provisioning.

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

## Blob on web only

**Cloud mutation / billing and consent pause.** Create Blob through the `web` project's dashboard so the credential mode is explicit before provisioning. Do not create or connect Blob for `mkt`.

Create Blob from the `web` project's **Storage** page:

1. Choose **Create Database**, then **Blob**.
2. Name the public store `blob-<package-name>-apps` and use `iad1` unless the product requires another region. Blob access cannot be changed after creation, so replace an existing private store rather than reusing it for this contract.
3. Keep the environment-variable prefix as `BLOB` and leave **Add a read-write token env var** unchecked.
4. After creation, open the store's **Projects** page and update the `web` connection to include Development, Preview, and Production.
5. Confirm the connection lists `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY`, and that the project does not contain `BLOB_READ_WRITE_TOKEN`.

`BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY` are the stable connection values validated by the shared Blob environment contract. The public key is available for future webhook verification without coupling current file operations to a webhook implementation. `BLOB_READ_WRITE_TOKEN` is represented as an optional compatibility credential, but the default setup must leave it absent. Vercel supplies short-lived OIDC identity to the Blob SDK at runtime; application code must not read or validate the raw `VERCEL_OIDC_TOKEN`.

`lib/files/files-service.ts` supplies the provider-neutral Files SDK surface with deterministic keys, permanent public reads, and constrained browser-direct uploads. Public Blob URLs are unlisted rather than access-controlled, so callers must use this default only for non-sensitive product media such as profile avatars. Overwrites are rejected by default; callers can construct a separate `FileService` with `allowOverwrite: true` for intentional stable-key replacement. It leaves product object paths and per-use-case upload limits to the caller.

## Resend on web only

**Cloud mutation / sending-domain pause.** Install Resend from the Vercel Marketplace only after the product owns a sending domain and can add its DNS records. A `<project>.vercel.app` hostname is not a sending identity, and a Vercel project may own several custom domains, so the correct domain cannot be inferred from the project link.

During installation:

1. Select the same team that owns `web` and connect only the `web` project.
2. Name the integration `resend-<package-name>-apps`.
3. Use the free plan and `us-east-1` unless the product requires another supported region.
4. Enter the exact sending domain the product owns.
5. Make the integration available to Development, Preview, and Production.
6. Add the generated SPF and DKIM records to the domain's DNS, then confirm verification in Resend.
7. Confirm `RESEND_API_KEY` is present in the connected `web` environments and absent from `mkt`.
8. Add `RESEND_EMAIL_DOMAIN` to the same `web` environments with the verified hostname only, such as `example.com`, not a URL.

The shared Resend environment contract requires both values because the API key authorizes delivery while the verified hostname defines valid sender addresses. `lib/email/resend.ts` exports the server-only Resend client without inventing an email-delivery abstraction. Better Auth Infrastructure's typed `sendEmail` API and hosted templates remain available for auth email flows; the product chooses the mailbox portion of sender addresses when it implements those flows.

## Production gate

**Production mutation requires explicit target confirmation.** Do not run a production migration or deploy merely because local checks pass. Before authorizing production:

1. Confirm the exact Vercel team, `web` project, production branch, and Neon primary branch.
2. Re-run local checks and the `web` build with the intended environment.
3. Confirm the product migration first succeeded in a non-production environment.
4. Prove a Preview deployment received isolated Neon URLs and the observed auth health response.
5. Review provider, billing, and OAuth consent implications.
6. Only then apply the production migration/deployment through the confirmed provider flow.

Disposable `foobar` validation confirmed separate `web` and `mkt` projects under one organization and unconnected Neon creation in that organization. A CLI-created private Blob store used the legacy read-write-token connection; the dashboard flow was verified with a private `iad1` store, OIDC, no read-write-token environment variable, and a `web` connection covering Development, Preview, and Production. The template now requires a public store, so that access choice remains unproven in the disposable project. Resend was not provisioned there because it had no owned sending domain. The validation did not connect Neon, apply a product migration, or deploy a Preview. Treat those product-specific gates as unproven until the minted workspace records its own evidence.
