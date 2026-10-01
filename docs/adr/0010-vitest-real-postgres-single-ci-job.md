# Testing: Vitest projects, real Postgres for integration, one CI job

There's one root `vitest.config.ts` with three projects:

- `unit`: pure domain/contracts code plus api/worker bits that don't need a DB.
- `integration`: `*.int.test.ts` files that run against real Postgres, with files run serially.
- `web`: happy-dom + `@vue/test-utils`.

Integration `globalSetup` refuses any database whose name doesn't end in `_test`, then runs the same migrator as `pnpm db:migrate`. Tests `TRUNCATE` every schema table before each test. We don't wrap tests in a rolled-back transaction, because the locking tests need real concurrent connections.

Fakes are used only at process boundaries: the clock, sleep/abort in the loop, `fetch` in web, and the logger. There's no `vi.mock` of `@wepush/*`, repos or services, and no fake timers in integration tests.

CI is a single GitHub Actions job with a `postgres:18` service. It runs lint → typecheck → migration drift (`db:generate` must leave no diff) → test with coverage (reported, not gated) → build. There are no git hooks; run `pnpm check` locally.
