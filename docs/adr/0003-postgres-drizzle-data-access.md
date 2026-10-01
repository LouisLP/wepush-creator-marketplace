# Postgres 18 + Drizzle query builder, committed SQL migrations, repos over a unit of work

Persistence is Postgres 18, accessed through Drizzle's SQL-like query builder (not its relational `db.query` API) on `pg`. The schema is plain TS, so row types come from `$inferSelect` with no codegen, and Drizzle supports `FOR UPDATE SKIP LOCKED`, which Closing depends on. Postgres 18 is pinned because primary keys default to its native `uuidv7()`.

- **Migrations**: `drizzle-kit generate` writes SQL into `packages/db/migrations/`, and that SQL is committed. Hand edits are allowed. `drizzle-kit push` is banned. Migrations are applied programmatically by `pnpm db:migrate` and never on api/worker boot. They're forward-only, and CI fails on drift.
- **Repos**: `createXRepo(exec)` takes either the pool-backed db or a transaction and returns domain-shaped objects (branded ids, `Cents`, `Date`), so Drizzle types never leave `packages/db`. `createUnitOfWork(db).run(repos => …)` opens one transaction. Repo types are inferred from the implementation, and there are no ports in domain.
- **Concurrency**: READ COMMITTED, plus explicit row locks and DB constraints (unique, FK, CHECK) as the backstop. pg errors are translated into typed `UniqueViolationError` / `ForeignKeyViolationError` / `CheckViolationError`, and services map those to API codes.
- **Columns**: money is `bigint` `*_cents` (mode `number`, USD only); ratios are `double precision`; time is `timestamptz` and every process runs with `TZ=UTC`; closed sets are `pgEnum`s built from domain's `as const` arrays. Business time comes from an injected clock, never from SQL `now()`.

## Considered options

Kysely (schema types would be hand-written or codegen'd), Prisma (heavy, and locking is awkward), raw `pg` (untyped).
