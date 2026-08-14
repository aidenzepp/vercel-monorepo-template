# vercel-monorepo-template - agent notes

Template monorepo for personal workspaces. Apps are empty until you mint one.

## Error handling

- No built-in `try/catch` in app or package code.
- Use `result.trycatch` from `@workspace/utils/result` around one atomic operation.
- Lint rule: `workspace/no-built-in-try-catch` (off only in `packages/utils/src/result.ts`).

## Logging

- Use `logger` from `@workspace/utils/logger`.
- Logs are pretty only when `NODE_ENV=development`; other environments receive JSON lines.

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
- Import from package subpaths: `@workspace/utils/result`, `@workspace/utils/logger`, etc.

## Skills policy

Ship only foundation skills that always apply. Right now that is `conventional-commits`.

Optional stack skills (drizzle-first, error-messages, bonsai, etc.) live in the personal skills library and get copied into a minted app when that app needs them. Do not vendor uncertain stack choices into this template.
