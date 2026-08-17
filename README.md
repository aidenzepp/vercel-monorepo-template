# vercel-monorepo-template

Personal Bun + Turborepo monorepo template with apps removed and a small shared foundation (`packages/utils`, Ultracite lint/format, agent skills).

This is a starting point for new personal workspaces. It is not tied to Hono, MCP, Plaid, or any one product stack.

## What you get

- Bun workspaces: `apps/*`, `packages/*`
- Turborepo scripts for build, lint, format, typecheck
- Ultracite (oxlint + oxfmt) with a local `workspace` plugin
- TypeScript 7's native compiler
- `packages/utils`: Result, Option, Zero, Pino logger
- Next.js app generator with the complete ShadCN component set
- Agent skills: generate-next-app, conventional-commits

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

## Mint a Next.js app into `apps/`

`apps/` starts empty on purpose. Generate the default Next.js application shape with a strict lowercase kebab-case name:

```bash
bun run create:next customer-dashboard
```

The generator always uses the current `shadcn@latest` CLI with preset `b1Ymqvgiw`, Next.js, Base UI, RTL support, and pointer cursors. It upgrades the preset's Next.js dependency to the current release for TypeScript 7 support, stops if `apps/<name>` already exists, and never forces an overwrite.

Each generated app includes:

- package name `@workspace/<name>` and workspace scripts;
- TypeScript 7;
- every current ShadCN component;
- the `@/` import alias created by ShadCN.

The generator removes ShadCN's nested Git repository, app lockfile, empty Next.js configuration, ESLint, and Prettier configuration so the root Bun lockfile and Ultracite remain authoritative. Ultracite's Oxfmt preset already enables Tailwind class sorting.

After removing an app directory, run `bun install`; Bun automatically prunes the deleted workspace and its orphaned dependencies from the root lockfile.

## Other app types

Next.js is the default generator, not a restriction. A CLI, worker, or other runtime can still be added manually under `apps/` when the product calls for it.

Example shape:

```text
apps/
  my-app/
    package.json
    src/
    tsconfig.json
```

Wire package scripts so Turbo can run `dev`, `build`, `lint`, `typecheck`, and `format` for a manually created app.

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
