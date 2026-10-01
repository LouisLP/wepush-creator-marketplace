# Fastify 5 on Node 24 native type stripping, no build step

The API is Fastify 5: it gives us pino logging, plugin encapsulation (which the per-role actor hooks rely on), `setErrorHandler`, `app.inject()` for tests without a port, and a Zod type provider. `buildApp(deps)` takes explicit dependencies and never reads env; `server.ts` is the only place that touches config, the pool, signals and `listen`.

The api and worker run `.ts` directly on Node 24 type stripping (`node --watch src/server.ts` in dev, `node src/server.ts` in prod), and `tsc --noEmit` at the root does the type checking. That rules out non-erasable syntax, so `tsconfig.base.json` enforces `erasableSyntaxOnly` and `verbatimModuleSyntax`: no enums (use `as const` unions), no parameter properties, `.ts` extensions on relative imports, and no `paths` aliases. Workspace packages strip too, because pnpm symlinks resolve to their real `packages/*/src` paths outside `node_modules`.

## Considered options

- **Hono**: its RPC client doesn't buy anything once web depends only on `contracts`, and we'd have to build logging and errors ourselves.
- **Express**: weak typing and manual async error handling.
- **A tsx/tsup build**: kept as the fallback if type stripping ever blocks us.
