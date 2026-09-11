# vercel-monorepo-template - agent notes

Personal monorepo foundation with two checked-in Next.js applications and shared UI.

## Application ownership

- `apps/web` is the authenticated product. It owns its environment contract, Neon connection, Drizzle schema and migrations, Better Auth runtime configuration, and auth API route.
- `apps/mkt` is the public marketing site. Do not add authentication or database dependencies there for convenience; keep product state behind `web`.
- Both production build scripts use `next build --webpack` until a current Next.js/Turbopack build is proven in this environment.
- `packages/better-auth` owns provider-neutral validation, plugin configuration values, and Better Auth-owned error catalogs. It must not own a database, environment variables, framework adapters, provider credentials, delivery integrations, or product-specific user fields and copy. Import its public surfaces through direct subpaths.
- `packages/ui` owns shared Shadcn components, styles, hooks, and Next.js providers. Import its public surfaces through direct subpaths such as `@workspace/ui/components/button` and `@workspace/ui/next/theme-provider`; do not introduce a barrel.
- Both application layouts mount the shared theme provider plus Vercel Analytics and Speed Insights. No dedicated async-boundary test or application consumer exists; its current evidence is limited to `packages/ui` typechecking.

`docs/setup.md` is the setup and cloud-configuration runbook. It distinguishes locally verified commands and disposable-resource findings from the product Preview and production gates that remain intentionally unproven.

## Error handling

- No built-in `try/catch` in app or package code.
- Use `result.trycatch` from `@workspace/utils/result` around one atomic operation.
- Lint rule: `workspace/no-built-in-try-catch` (off only in `packages/utils/src/result.ts`).

## Logging

- Use `logger` from `@workspace/utils/logger`.
- Logs are pretty only when `NODE_ENV=development`; other environments receive JSON lines.

## Database

- `apps/web` alone owns Neon, Drizzle, its schema, and migrations. `apps/mkt` and `packages/ui` must not add database dependencies or environment variables.
- The web runtime uses the pooled `DATABASE_URL`; Drizzle Kit uses `DATABASE_URL_UNPOOLED` from the repository-root `.env.local`. Keep Neon variables unprefixed so the upstream `neonVercel()` contract stays valid.
- `db:generate` writes migration files and `db:migrate` mutates the selected database. Run migrations against a confirmed non-production target first; do not add automatic Vercel migrations until a product proves that path in Preview.

## Lint / format

Ultracite oxlint + oxfmt. Root scripts: `check`, `fix`, `lint`, `format`, `typecheck`.

## Skills

- `.agents/skills/component-decomposition` when creating, changing, or reviewing React UI
- `.agents/skills/async-boundaries` when composing React loading, failure, streaming, or Promise-reading regions
- `.agents/skills/document-code` when writing or reviewing TypeScript and TSX program units
- `.agents/skills/betterauth-best-practices` when configuring or reviewing Better Auth
- `.agents/skills/conventional-commits` when committing

See Skills policy below for what stays out of the template.

## Apps

`web` and `mkt` are the standard Next.js applications. Other runtimes can be added under `apps/` only when the product needs them. Do not pull Hono, MCP, Plaid, or a provider-specific auth SDK into shared foundation code.

## Imports

- Avoid barrel files (`index.ts` that re-export everything).
- Import from package subpaths: `@workspace/utils/result`, `@workspace/utils/logger`, etc.

## Skills policy

Ship foundation skills that apply broadly across the checked-in workspace. The repo-owned foundation set is `async-boundaries`, `component-decomposition`, `document-code`, and `conventional-commits`.

Optional stack skills (drizzle-first, error-messages, bonsai, etc.) live in the personal skills library and get copied into a product workspace when that workspace needs them. Keep a copied stack skill only while the checked-in stack requires it; do not vendor uncertain stack choices into this template.
