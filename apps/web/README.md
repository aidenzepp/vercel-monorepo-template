# Web

`@workspace/web` is the authenticated full-stack product application. It is the only application that owns product state and its operational contracts:

- environment validation in `env.ts`, using upstream `vercel()` and `neonVercel()` presets with no custom Neon prefix;
- Neon connection URLs, with the pooled URL used at runtime and the unpooled URL used by Drizzle Kit;
- a provider-neutral `FileService` backed by private Vercel Blob storage, plus the Resend SDK for product-owned email flows;
- Drizzle schema and product-owned migration commands under `db/`;
- provider-neutral Better Auth configuration, client, and `app/api/auth/[...all]/route.ts`.

The auth server enables Username, Anonymous, Passkey, Two-Factor Authentication, API Key, Organization, and OpenAPI as foundation defaults. It also includes Admin, Last Login Method, OAuth Proxy, Better Auth Infrastructure Dash, and the Next Cookies integration. Schema-affecting defaults come from one shared plugin factory used by runtime auth and schema generation. Provider-neutral validation and error contracts live in `@workspace/better-auth`; the web application retains ownership of its server, database, environment, and delivery integrations.

The template does not choose credential-authentication or email-delivery policy. Better Auth background work is registered with Vercel `waitUntil`, and the generated schema includes the documented lookup indexes for the enabled plugins.

`lib/files/files-service.ts` extends the Files SDK's Vercel Blob adapter with signed private downloads and browser-direct uploads. Callers own object keys and choose upload content types, size limits, and URL lifetimes per operation; the service keeps keys deterministic and rejects overwrites by default. Constructing a separate `FileService` with `allowOverwrite: true` enables intentional stable-key replacement. It deliberately does not define product paths, authorization rules, or upload UI. The application environment expects Vercel's auto-rotating OIDC credentials through `VERCEL_OIDC_TOKEN` and `BLOB_STORE_ID`; no long-lived Blob token belongs in its environment contract.

Do not move these concerns into `packages/ui` or `apps/mkt`. `packages/ui` is presentation-only; `mkt` stays public and database-free.

Both application layouts share the UI theme provider and mount Vercel Analytics and Speed Insights. The shared async boundary has no standalone test or application consumer; its current evidence is limited to `packages/ui` typechecking.

Use [../../docs/setup.md](../../docs/setup.md) for local verification, Vercel/Neon configuration, Better Auth Infrastructure, schema changes, and the provider-addition workflow. The provisioning contract was checked with disposable resources; every minted product must still prove its own Preview deployment and isolated Neon branch before production.
