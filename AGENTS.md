# vercel-monorepo-template - agent notes

Template monorepo for personal workspaces. Apps are empty until you mint one.

## App generator

- Default command: `bun run create:next <lowercase-kebab-name>`.
- The generator creates a Next.js app from the configured ShadCN preset, adds every ShadCN component, and uses TypeScript 7.
- Commands and their user-facing copy live in `tools/generators/next-app/commands.json`; `index.ts` only validates the app name, fills path markers, and runs the commands serially.
- Keep app-specific providers, environment variables, analytics, and product dependencies out of the generator until they become universal requirements.
- ShadCN registry source under `components/ui/` and its generated `use-mobile` hook are treated as vendored code and excluded from Ultracite lint rules.
- Use the generator rather than copying an existing product app; existing app features are not template conventions.
- After removing an app, run `bun install` to prune its workspace and dependencies from `bun.lock`; no generator-specific delete command is required.

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

- `.agents/skills/generate-next-app` when work may benefit from both server functionality and a browser interface
- `.agents/skills/conventional-commits` when committing

See Skills policy below for what stays out of the template.

## Apps

Put new runtimes under `apps/`. Next.js is the generated default, but other runtimes remain allowed. Do not pull Hono, MCP, or Plaid into the template itself unless a new app truly needs them.

## Imports

- Avoid barrel files (`index.ts` that re-export everything).
- Import from package subpaths: `@workspace/utils/result`, `@workspace/utils/logger`, etc.

## Skills policy

Ship only foundation skills that apply broadly across generated workspaces. Right now those are `generate-next-app` and `conventional-commits`.

Optional stack skills (drizzle-first, error-messages, bonsai, etc.) live in the personal skills library and get copied into a minted app when that app needs them. Do not vendor uncertain stack choices into this template.
