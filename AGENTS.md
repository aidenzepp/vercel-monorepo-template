# vercel-monorepo-template - agent notes

Template monorepo for personal workspaces. Apps are empty until you mint one.

## Error handling

- No built-in `try/catch` in app or package code.
- Use `result.trycatch` from `@workspace/utils/result` around one atomic operation.
- Lint rule: `workspace/no-built-in-try-catch` (off only in `packages/utils/src/result.ts`).

## Environment

- Do not read `process.env` in ordinary code.
- Add shared keys through the Zod env helper in `packages/utils/src/env.ts` (`createEnv` + `EnvSchema` + direct `process.env.KEY` snapshot).
- Import `{ env }` from `@workspace/utils/env`.
- Apps that need product-specific keys (including database URLs) should define them locally with `createEnv` from `@workspace/utils/env`, or extend the shared schema when the key is truly workspace-wide.
- Lint rule: `workspace/no-process-env` (off in the env module; also off app-local drizzle-kit configs when you add them).

## Logging

- Use `logger` from `@workspace/utils/logger`.
- Controlled by `LOG_LEVEL` and `LOG_PRETTY` in the env contract.

## Database

No database layer is bundled. If an app needs a DB, add the ORM/driver inside that app (or a product-specific package) and copy any relevant skills (for example drizzle-first) from the personal skills library at mint time.

## Lint / format

Ultracite oxlint + oxfmt. Root scripts: `check`, `fix`, `lint`, `format`, `typecheck`.

## Skills

- `.agents/skills/conventional-commits` when committing

See Skills policy below for what stays out of the template.

## Apps

Put new runtimes under `apps/`. No required framework. Do not pull Hono, MCP, or Plaid into the template itself unless a new app truly needs them.

## Imports

- Avoid barrel files (`index.ts` that re-export everything).
- Import from package subpaths: `@workspace/utils/result`, `@workspace/utils/env`, `@workspace/utils/logger`, etc.

## Skills policy

Ship only foundation skills that always apply. Right now that is `conventional-commits`.

Optional stack skills (drizzle-first, error-messages, bonsai, etc.) live in the personal skills library and get copied into a minted app when that app needs them. Do not vendor uncertain stack choices into this template.
