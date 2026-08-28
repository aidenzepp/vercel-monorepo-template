# Marketing

`@workspace/mkt` is the public marketing application. Its job is to present public content and route visitors to the product; it is not an alternate product backend.

Keep this boundary strict:

- it consumes shared presentation code through direct `@workspace/ui/...` subpaths;
- its layout mounts the shared theme provider, Vercel Analytics, and Speed Insights;
- it must not acquire Better Auth, Neon, Drizzle, migrations, auth routes, or database environment variables for convenience.

Vercel treats `mkt` as a separate project from `web`, so its deployment and environment configuration stay independent. Follow the provisional linking guidance in [../../docs/setup.md](../../docs/setup.md); the later live integration pass must confirm the exact Vercel behavior before it is treated as verified.

Its production build currently uses `next build --webpack`. Keep that workaround until a current Next.js/Turbopack production build is proven in this environment.
