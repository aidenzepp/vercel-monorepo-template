# Web

`@workspace/web` is the authenticated full-stack product application. It is the only application that owns product state and its operational contracts:

- environment validation in `env.ts`, using upstream `vercel()` and `neonVercel()` presets with no custom Neon prefix;
- Neon connection URLs, with the pooled URL used at runtime and the unpooled URL used by Drizzle Kit;
- Drizzle schema, generated migrations, and migration commands under `db/`;
- provider-neutral Better Auth configuration, client, and `app/api/auth/[...all]/route.ts`.

Do not move these concerns into `packages/ui` or `apps/mkt`. `packages/ui` is presentation-only; `mkt` stays public and database-free.

Both application layouts share the UI theme provider and mount Vercel Analytics and Speed Insights. The shared async boundary has no standalone test or application consumer; its current evidence is limited to `packages/ui` typechecking.

Use [../../docs/setup.md](../../docs/setup.md) for local verification, Vercel/Neon configuration, schema changes, and the provider-addition workflow. Cloud instructions are provisional until the live integration pass records the provider contract.
