# WePush Creator Marketplace

A two-sided marketplace. Advertisers run Campaigns, Creators bid to take part, and a scheduled worker closes each Campaign at its Bidding Deadline and picks the Winners within Budget. The domain glossary is in [`CONTEXT.md`](CONTEXT.md), and architecture decisions are in [`docs/adr/`](docs/adr).

> **Status:** walking skeleton (Map 1). The architecture is in place end to end; the marketplace features and the matching/pricing formulas come next.

## Repository layout

```
apps/
  web/        Vue 3 + Pinia + Vite             → @wepush/contracts
  api/        Fastify 5 HTTP API               → contracts, domain, db
  worker/     campaign-closing poll loop       → domain, db
packages/
  domain/     pure business rules, no I/O
  db/         Drizzle schema, migrations, repos, unit of work
  contracts/  Zod API schemas + endpoint descriptors
```

## Running locally

### Prerequisites

- Node **24.12+** (`nvm use` picks it up from `.nvmrc`)
- pnpm **11** (`corepack enable` uses the version pinned in `packageManager`)
- Docker, for Postgres 18

### Install and start

```sh
cp .env.example .env
pnpm install
pnpm dev        # postgres up → migrate → api + worker + web
pnpm db:seed    # optional, in another terminal: demo advertisers, creators, and a Campaign closing in 2 minutes
```

Then open http://localhost:5173. You'll get a role picker; choose (or create) an Advertiser or a Creator to act as. There's no authentication. The API's dev OpenAPI UI is at http://localhost:5173/api/docs.

### Production images locally

```sh
pnpm prod       # docker compose --profile prod up --build
```

This builds the `api` and `worker` targets of the root `Dockerfile` and runs them against the compose Postgres: `migrate` (a one-off from the api image) → `api` → `worker`. The api image also serves the built web app, so the UI and API share http://localhost:8080. `GET /healthz` is liveness, and `GET /readyz` checks the database (503 when it's unreachable). The OpenAPI UI is off in production. Stop it with `docker compose --profile prod down`.

### Environment variables

All of these live in the root `.env`, and every process validates them at startup.

| Variable | Default | Used by |
|---|---|---|
| `NODE_ENV` | `development` | api, worker (pretty logs and dev docs unless `production`) |
| `LOG_LEVEL` | `info` | api, worker (`debug` also logs every worker tick) |
| `TZ` | must be `UTC` | api, worker, db scripts |
| `DATABASE_URL` | — | api, worker, db scripts |
| `TEST_DATABASE_URL` | — | integration tests (database name must end in `_test`) |
| `DB_POOL_MAX` | `10` | api, worker |
| `API_HOST` / `API_PORT` | `0.0.0.0` / `3000` | api; web's dev proxy reads `API_PORT` too |
| `CLOSE_POLL_INTERVAL_MS` | `5000` | worker |

### Database

| Command | What it does |
|---|---|
| `pnpm infra:up` / `infra:down` | Start or stop the compose Postgres (creates `wepush` and `wepush_test`) |
| `pnpm infra:reset` | Stop it and delete its volume |
| `pnpm db:migrate` | Apply the committed SQL migrations. This is always an explicit step; the api and worker never migrate on boot |
| `pnpm db:generate` | Generate a new migration after editing `packages/db/src/schema` |
| `pnpm db:seed` | Insert demo rows. Idempotent |

### Starting apps individually

```sh
pnpm --filter @wepush/api dev
pnpm --filter @wepush/worker dev
pnpm --filter @wepush/web dev
```

### Tests and checks

```sh
pnpm test            # all Vitest projects: unit, integration (needs Postgres up), web
pnpm test:unit       # unit + web only, no DB
pnpm test:int        # integration only
pnpm check           # lint → typecheck → test, the same gates CI runs
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, a migration drift check, tests with coverage, and the web build against a `postgres:18` service. A second job, `images`, builds both Docker targets without pushing. To make `ci` a required check, turn on branch protection on `main`; that's a repo setting, not something in this repo.

## Marketplace design

_To be written with Map 2: matching, ranking, pricing, bid evaluation, winner selection, and their limitations._

## Production

_To be written with Map 2: deployment, database, scheduled jobs, config/secrets, observability, errors, scaling, reliability._
