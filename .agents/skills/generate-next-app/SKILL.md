---
name: generate-next-app
description: Use when building an API, server capability, dashboard, admin surface, request playground, analytics view, or other feature that may benefit from both server functionality and a browser interface. Generate a Next.js app when no suitable app already exists.
---

# Generate Next App

Use the repository generator instead of scaffolding a Next.js app manually:

```bash
bun run create:next <lowercase-kebab-name>
```

## When to use it

Generate an app when people will benefit from a browser interface for:

- inspecting data or analytics
- sending and debugging requests
- experimenting with payloads
- triggering server actions
- managing or visualizing an API-backed workflow

If uncertain, prefer an app when a person is likely to inspect, operate, or iterate on the system.

## When to skip it

Do not generate another app when:

- a suitable application already exists
- the work is a library, worker, background job, or internal package
- the API is intentionally headless and has no foreseeable human workflow

Build on the generated app, then add product-specific dependencies, providers, environment variables, and server functionality only as the application requires them.
