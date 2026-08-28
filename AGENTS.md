# vercel-monorepo-template - agent notes

Personal monorepo foundation with two checked-in Next.js applications and shared UI.

## Application ownership

- `apps/web` is the authenticated product. It owns its environment contract, Neon connection, Drizzle schema and migrations, Better Auth configuration, and auth API route.
- `apps/mkt` is the public marketing site. Do not add authentication or database dependencies there for convenience; keep product state behind `web`.
- `packages/ui` owns shared Shadcn components, styles, hooks, and Next.js providers. Import its public surfaces through direct subpaths such as `@workspace/ui/components/button` and `@workspace/ui/next/theme-provider`; do not introduce a barrel.
- Both application layouts mount the shared theme provider plus Vercel Analytics and Speed Insights. No dedicated async-boundary test or application consumer exists; its current evidence is limited to `packages/ui` typechecking.

`docs/setup.md` is the setup and cloud-configuration runbook. It deliberately distinguishes locally verified commands from provisional Vercel and Neon steps.

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
- `db:generate` writes migration files and `db:migrate` mutates the selected database. Run migrations against a confirmed non-production target first; automatic Vercel migration behavior remains provisional until the live integration pass proves it.

## Lint / format

Ultracite oxlint + oxfmt. Root scripts: `check`, `fix`, `lint`, `format`, `typecheck`.

## Skills

- `.agents/skills/conventional-commits` when committing

See Skills policy below for what stays out of the template.

## Apps

`web` and `mkt` are the standard Next.js applications. Other runtimes can be added under `apps/` only when the product needs them. Do not pull Hono, MCP, Plaid, or a provider-specific auth SDK into shared foundation code.

## Imports

- Avoid barrel files (`index.ts` that re-export everything).
- Import from package subpaths: `@workspace/utils/result`, `@workspace/utils/logger`, etc.

## Skills policy

Ship only foundation skills that apply broadly across the checked-in workspace. Right now that is `conventional-commits`.

Optional stack skills (drizzle-first, error-messages, bonsai, etc.) live in the personal skills library and get copied into a minted app when that app needs them. Do not vendor uncertain stack choices into this template.
