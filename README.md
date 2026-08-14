# vercel-monorepo-template

Personal Bun + Turborepo monorepo template with apps removed and a small shared foundation (`packages/utils`, Ultracite lint/format, agent skills).

This is a starting point for new personal workspaces. It is not tied to Hono, MCP, Plaid, or any one product stack.

## What you get

- Bun workspaces: `apps/*`, `packages/*`
- Turborepo scripts for build, lint, format, typecheck
- Ultracite (oxlint + oxfmt) with a local `workspace` plugin
- `packages/utils`: Result, Option, Zero, Pino logger
- Agent skill: conventional-commits

No database/ORM is bundled. Add one inside an app when that app needs it.

## Setup

```bash
bun install
```

Useful root scripts:

```bash
bun run typecheck
bun run lint
bun run format
bun run check
bun run fix
```

## Mint an app into `apps/`

`apps/` starts empty on purpose. Add whatever runtime you need (Next.js, a CLI, a worker, a small API). There is no required server framework.

Example shape:

```text
apps/
  my-app/
    package.json
    src/
    tsconfig.json
```

Then wire package scripts so Turbo can run `dev`, `build`, `lint`, `typecheck`, and `format` for that app.

Import shared foundation code from workspace package subpaths:

```ts
import { result } from "@workspace/utils/result";
import { logger } from "@workspace/utils/logger";
```

## Packages

### `@workspace/utils`

- `result.trycatch` for atomic fallible work (prefer this over built-in try/catch)
- `option` / `zero` helpers
- `logger` (Pino; pretty output in development and JSON lines elsewhere)

### `@workspace/typescript-config`

Shared tsconfig bases (`base`, `nextjs`, `react-library`).

## Lint rules

Custom oxlint plugin: `tools/oxlint-plugin-workspace`

- `workspace/no-built-in-try-catch`

Built-in try/catch is allowlisted only in `packages/utils/src/result.ts`.

## Agent notes

See `AGENTS.md` and `.agents/skills/`.
