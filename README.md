# templ8

Personal Bun + Turborepo monorepo foundation with two Next.js applications and shared packages.

It establishes shared presentation infrastructure while keeping product state in the authenticated application. It is not tied to Hono, MCP, Plaid, or any provider-specific authentication flow.

## What you get

- Bun workspaces: `apps/*`, `packages/*`
- Turborepo scripts for build, lint, format, typecheck
- Ultracite (oxlint + oxfmt) with a local `workspace` plugin
- TypeScript 7's native compiler
- `packages/better-auth`: shared Better Auth configuration and error contracts
- `packages/t3-env`: composable Better Auth, Resend, and Vercel Blob environment contracts
- `packages/utils`: Result, Option, Zero, Pino logger
- `packages/ui`: the complete shared Shadcn component set, styles, hooks, and Next.js providers
- `apps/web`: authenticated full-stack product foundation
- `apps/mkt`: public marketing foundation
- Repo-owned agent skills for async boundaries, component decomposition, code documentation, and conventional commits

`web` owns Neon, Drizzle, Better Auth, and the auth route. `mkt` intentionally has no authentication or database dependency.

## Setup

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun install --frozen-lockfile
```

New dependency resolutions must also pass the six-hour release-age gate in `bunfig.toml`; versions already pinned in `bun.lock` are unaffected.

Useful root scripts:

```bash
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run typecheck
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run lint
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run format
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run check
PATH=/Users/sterling/.bun/bin:$PATH /Users/sterling/.bun/bin/bun run fix
```

For the full local-to-cloud workflow, including manual Vercel service configuration and the still-required product Preview gate, read [docs/setup.md](docs/setup.md). Each app also documents its ownership boundary: [web](apps/web/README.md) and [mkt](apps/mkt/README.md).

## Package boundaries

Import shared foundation code from direct workspace package subpaths:

```ts
import { result } from "@workspace/utils/result";
import { logger } from "@workspace/utils/logger";
import { Button } from "@workspace/ui/components/button";
import { usernameSchema } from "@workspace/better-auth/config/username";
import { env as resendEnv } from "@workspace/t3-env/config/resend";
```

`packages/ui` is shared presentation infrastructure. Keep application-specific data, routes, environment variables, and providers in the owning application.

## Packages

### `@workspace/better-auth`

- provider-neutral validation and Better Auth configuration consumed by runtime and schema generation
- version-matched Better Auth redirect error codes for application-owned recovery copy
- no database, environment, framework, provider, or user-interface ownership

### `@workspace/t3-env`

- server environment contracts composed through T3 Env's `extends` option
- direct config subpaths for Better Auth, Resend, and Vercel Blob
- no duplicate Neon or Vercel schemas; applications use T3 Env's upstream presets

### `@workspace/utils`

- `result.trycatch` for atomic fallible work (prefer this over built-in try/catch)
- `option` / `zero` helpers
- `logger` (Pino; pretty output in development and JSON lines elsewhere)

### `@workspace/typescript-config`

Shared tsconfig bases (`base`, `nextjs`, `react-library`).

## Lint rules

Custom oxlint plugin: `tools/oxlint-plugin-workspace`

- `workspace/no-app-button-variants`
- `workspace/no-built-in-try-catch`
- `workspace/prefer-ui-primitives`
- `workspace/require-doc-comment`

Built-in try/catch is allowlisted only in `packages/utils/src/result.ts`.

## Agent notes

See `AGENTS.md` and `.agents/skills/`.
