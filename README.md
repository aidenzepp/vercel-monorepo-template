# vercel-monorepo-template

Personal Bun + Turborepo monorepo foundation with two Next.js applications and shared packages.

It establishes shared presentation infrastructure while keeping product state in the authenticated application. It is not tied to Hono, MCP, Plaid, or any provider-specific authentication flow.

## What you get

- Bun workspaces: `apps/*`, `packages/*`
- Turborepo scripts for build, lint, format, typecheck
- Ultracite (oxlint + oxfmt) with a local `workspace` plugin
- TypeScript 7's native compiler
- `packages/utils`: Result, Option, Zero, Pino logger
- `packages/ui`: the complete shared Shadcn component set, styles, hooks, and Next.js providers
- `apps/web`: authenticated full-stack product foundation
- `apps/mkt`: public marketing foundation
- Agent skill: conventional-commits

`web` owns Neon, Drizzle, Better Auth, and the auth route. `mkt` intentionally has no authentication or database dependency.

## Setup

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun install
```

Useful root scripts:

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run typecheck
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run lint
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run format
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run check
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run fix
```

For the full local-to-cloud workflow, including the intentionally provisional Vercel and Neon stages, read [docs/setup.md](docs/setup.md). Each app also documents its ownership boundary: [web](apps/web/README.md) and [mkt](apps/mkt/README.md).

## Package boundaries

Import shared foundation code from direct workspace package subpaths:

```ts
import { result } from "@workspace/utils/result";
import { logger } from "@workspace/utils/logger";
import { Button } from "@workspace/ui/components/button";
```

`packages/ui` is shared presentation infrastructure. Keep application-specific data, routes, environment variables, and providers in the owning application.

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
