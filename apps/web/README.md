# Web

`@workspace/web` is the authenticated full-stack product application. It is the only application that owns product state and its operational contracts:

- environment validation in `env.ts`, using upstream `vercel()` and `neonVercel()` presets with no custom Neon prefix;
- Neon connection URLs, with the pooled URL used at runtime and the unpooled URL used by Drizzle Kit;
- Drizzle schema and product-owned migration commands under `db/`;
- provider-neutral Better Auth configuration, client, and `app/api/auth/[...all]/route.ts`.

The auth server includes Admin, Last Login Method, Better Auth Infrastructure Dash, and Sentinel. Dash activity tracking generates `lastActiveAt` in the user schema. The browser client includes Admin, Last Login Method, and Sentinel; Sentinel supplies browser identification and automatic proof-of-work challenge solving, while product-specific enforcement policies remain unset. The server also includes Test Utils: it exposes privileged server context helpers but adds no public routes, and the browser client does not include it. Next.js Proxy remains a product choice.

Do not move these concerns into `packages/ui` or `apps/mkt`. `packages/ui` is presentation-only; `mkt` stays public and database-free.

Both application layouts share the UI theme provider and mount Vercel Analytics and Speed Insights. The shared async boundary has no standalone test or application consumer; its current evidence is limited to `packages/ui` typechecking.

Use [../../docs/setup.md](../../docs/setup.md) for local verification, Vercel/Neon configuration, Better Auth Infrastructure, schema changes, and the provider-addition workflow. The provisioning contract was checked with disposable resources; every minted product must still prove its own Preview deployment and isolated Neon branch before production.
