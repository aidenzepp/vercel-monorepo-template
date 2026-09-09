# Web

`@workspace/web` is the authenticated full-stack product application. It is the only application that owns product state and its operational contracts:

- environment validation in `env.ts`, using upstream `vercel()` and `neonVercel()` presets with no custom Neon prefix;
- Neon connection URLs, with the pooled URL used at runtime and the unpooled URL used by Drizzle Kit;
- private Vercel Blob storage and Resend email delivery;
- Drizzle schema and product-owned migration commands under `db/`;
- provider-neutral Better Auth configuration, client, and `app/api/auth/[...all]/route.ts`.

The auth server enables email/password, Username, Anonymous, Passkey, Two-Factor Authentication, API Key, Organization, and OpenAPI as foundation defaults. It also includes Admin, Last Login Method, OAuth Proxy, Better Auth Infrastructure Dash, Test Utils, and the Next Cookies integration. Schema-affecting defaults come from one shared plugin factory used by runtime auth and schema generation.

Resend handles Better Auth verification, reset, invitation, and email 2FA delivery through one server-only helper. Vercel Blob operations use a private-storage wrapper. Better Auth background work is registered with Vercel `waitUntil`, session reads use a short cookie cache, and rate limits persist in Postgres.

Do not move these concerns into `packages/ui` or `apps/mkt`. `packages/ui` is presentation-only; `mkt` stays public and database-free.

Both application layouts share the UI theme provider and mount Vercel Analytics and Speed Insights. The shared async boundary has no standalone test or application consumer; its current evidence is limited to `packages/ui` typechecking.

Use [../../docs/setup.md](../../docs/setup.md) for local verification, Vercel/Neon configuration, Better Auth Infrastructure, schema changes, and the provider-addition workflow. The provisioning contract was checked with disposable resources; every minted product must still prove its own Preview deployment and isolated Neon branch before production.
