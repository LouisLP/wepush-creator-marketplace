# WePush Creator Marketplace

A two-sided marketplace. Advertisers run Campaigns, Creators bid to take part, and a scheduled worker closes each Campaign at its Bidding Deadline and picks the Winners within Budget. The domain glossary is in [`CONTEXT.md`](CONTEXT.md), and architecture decisions are in [`docs/adr/`](docs/adr).

Both flows work end to end in the UI:

- **Advertiser:** Create Campaign → Review Campaign → Review Bids → Campaign Closes → View Winners
- **Creator:** View Matched Campaigns → Review Campaign → Place Bid → Track Bid → View Outcome

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
pnpm db:seed    # optional, in another terminal: wipes the database and loads the demo data (see below)
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
| `API_HOST` / `API_PORT` | `0.0.0.0` / `3000` (`.env.example` uses `127.0.0.1`) | api; web's dev proxy reads `API_PORT` too |
| `CLOSE_POLL_INTERVAL_MS` | `5000` | worker |

### Database

| Command | What it does |
|---|---|
| `pnpm infra:up` / `infra:down` | Start or stop the compose Postgres (creates `wepush` and `wepush_test`) |
| `pnpm infra:reset` | Stop it and delete its volume |
| `pnpm db:migrate` | Apply the committed SQL migrations. This is always an explicit step; the api and worker never migrate on boot |
| `pnpm db:generate` | Generate a new migration after editing `packages/db/src/schema` |
| `pnpm db:seed` | Wipe all marketplace data and load the demo data. Refuses when `NODE_ENV=production` |

### Demo data

`pnpm db:seed` truncates every table, including anything you created in the UI, and reinserts the same hand-written cast in one transaction: 3 Advertisers, 16 Creators, 9 Campaigns and 18 Pending Bids. Deadlines are relative to the moment you seed, so **re-seed right before demoing**. Every Campaign starts Open. The worker closes the three past-due ones on its first tick, so their Winners and Losers come from the real Closing code.

| Act as | What to look at |
|---|---|
| Glow Cosmetics | *Summer glow launch* closed with Winners and `over_budget` Losers, plus the nano Creator @tinyglam.tess, whose Parity Fee is under the $10 Fee floor, winning the leftover Budget. *Lip tint drop* closes 5 minutes after seeding |
| Fuel Fitness | *Protein bar taste test* closed, with @coreandcoffee losing `over_budget`. *Shaker bottle giveaway* closes 15 minutes after seeding. *Ambassador programme* is niche: only @plantpowerpri qualifies |
| Pixel Forge | *Closed beta keys* closed with no Bids, so no Winners |
| @glowbyana | A big TikTok beauty Creator matching both Open Glow Campaigns |
| @coreandcoffee | Just under the *Ambassador programme* minimum engagement rate, so it doesn't match |
| @lagfreeluna / @runwithraf | Engagement far above or below baseline: Estimated Impressions hit the engagement clamp at 2× and 0.5× |
| @wanderwithwen | No Matched Campaigns |

The closing-soon Campaigns only demo well within a few minutes of seeding.

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

Every number in the marketplace comes from one estimate, **Estimated Impressions**, and is priced against the Advertiser's **Target CPM** (what they're willing to pay per thousand views). I picked this anchor because it's the one goal the Advertiser states explicitly, and it lets both sides talk about the same thing: "how much am I paying per view?"

All the rules are pure functions in [`packages/domain`](packages/domain/src). Bid placement, the UI previews and the closing worker call the same functions, so what a Creator is shown when bidding is exactly what Closing judges later. The full write-up, with the alternatives I turned down, is [ADR 0012](docs/adr/0012-marketplace-formulas-scoring-v1.md).

### The building block: Estimated Impressions

```
estimatedImpressions = max(1, round(followers × reachRate × clamp(ER / baselineER, 0.5, 2)))
effectiveCpm         = fee × 1000 / estimatedImpressions
```

| | Instagram | TikTok |
|---|---|---|
| Reach Rate (share of followers who see a post) | 10% | 15% |
| Baseline Engagement Rate | 2% | 5% |
| Typical CPM range | $5–20 | $3–15 |

A Creator with twice the baseline engagement is assumed to reach twice as many people; half the baseline, half as many. The clamp stops a fake 40% engagement rate from inventing millions of views. The constants are sourced in [`docs/research`](docs/research/platform-reach-engagement-benchmarks.md).

### Matching: which Creators see a Campaign?

A Campaign sets its **Requirements**: one Platform, one or more Categories, a minimum follower count and (optionally) a minimum engagement rate. A Creator sees an Open Campaign only if they meet **every** Requirement, checked against their current profile. There's no "near miss" list, and Campaigns the Creator has already bid on move to their bids instead.

Strict matching keeps the rule easy to explain ("you need 10k followers on TikTok in fitness") and means an Advertiser never gets Bids from people they've ruled out. The Campaign page shows each Requirement with the Creator's own value next to it.

### Ranking: what order does a Creator see them in?

Each matched Campaign gets a **Relevance** score from 0 to 100, built from two factors the Creator cares about:

```
payout     = where Target CPM sits in the Platform's CPM range (0 at the low end, 1 at the high end)
budgetFit  = Budget / parityFee         (how many posts like mine the Budget could pay for)
fit        = budgetFit < 1 ? 0 : min(budgetFit, 5) / 5
relevance  = round(100 × (0.6 × payout + 0.4 × fit))
```

In plain terms: Campaigns that pay well per view, and that have enough Budget to realistically afford you, come first. Ties go to the earlier deadline. The UI shows both factors and their contribution, so "why is this #1?" has a visible answer. Relevance is absolute, not relative to the Creator's other Campaigns, so a Campaign's score doesn't jump around when others open or close.

### Pricing: what should a Creator charge?

```
parityFee    = estimatedImpressions × targetCpm / 1000
feeRange     = [$10, min(Budget, max($10, 3 × parityFee))]
suggestedFee = parityFee, kept inside the Fee Range
```

The **Suggested Fee** is the price at which the Creator delivers exactly the Advertiser's Target CPM. Creators can bid anywhere in the **Fee Range**: up to 3× parity (room for Creators who think they're worth more) but never over the whole Budget, and never under a $10 floor so tiny accounts can still bid. The bid form shows the Suggested Fee, the range, and a live Effective CPM badge as the Creator types. Out-of-range fees are rejected with `fee_out_of_range`.

### Bid evaluation: how good is a Bid?

When a Bid is placed it stores a **Bid Snapshot** (followers, engagement rate, Estimated Impressions, Effective CPM). Closing judges that snapshot, never the live profile, so a Creator can't game the result by editing their profile afterwards, and re-running Closing always gives the same answer.

```
cpmFit     = clamp(targetCpm / effectiveCpm, 0, 2) / 2      (cheaper per view than the target scores higher)
engagement = clamp(ER / baselineER, 0, 2) / 2
score      = round(100 × (0.75 × cpmFit + 0.25 × engagement), 2)
```

Price efficiency carries most of the weight because it's the Advertiser's stated goal. Engagement is a smaller tie-breaker for audience quality. A Bid is only **Eligible** if its snapshot still meets the follower and engagement minimums and its Fee is inside the Fee Range.

### Winner selection

1. Rank the Bids: Eligible first, then Score (high to low), then Fee (low to high), then who bid first.
2. Walk down the ranking with the Budget. If a Bid's Fee fits the **Remaining Budget**, it **Wins** and the Budget shrinks. If not, it's **Lost** (`over_budget`) and the walk carries on, so a cheaper Bid further down can still win.
3. Ineligible Bids are Lost with `requirements_not_met` or `fee_out_of_range`.

Every Bid stores its Score, Rank, factor breakdown, Loss Reason and the Remaining Budget when its turn came. A losing Creator sees something like "you were #3 and $120 was left for your $150 fee", and the Advertiser sees the Winners, spend and blended CPM. While a Campaign is still Open, the Advertiser sees a clearly labelled "if it closed now" projection. Creators don't see a provisional rank or the number of competing Bids, so they price on value rather than on the crowd.

Spend can never exceed Budget: the greedy walk guarantees it, and a database CHECK enforces it.

### Why these choices

- **One anchor.** Fee, ranking and scoring all hang off Target CPM and Estimated Impressions, so each number can be explained in terms of the others.
- **Explainability over optimality.** Every score is a short weighted sum with its factors stored, and the UI shows them. A smarter model that nobody can explain would hurt trust on both sides.
- **Both sides' incentives.** Advertisers get Bids priced in their own unit and Winners chosen by value for money. Creators get a fair Suggested Fee, a ranking based on what pays them well, and a clear reason when they lose.
- **Greedy, not optimal packing.** A knapsack solver would use Budget a bit better, but then the top-ranked Bid could lose for reasons its Creator can't understand or act on.

### Known limitations and trade-offs

- **Estimated Impressions is a heuristic.** It's built from public benchmarks and self-reported profile numbers, with no Category or content-quality signal. It's not a forecast.
- **CPM parity only prices views.** Production work, usage rights and so on aren't priced in, so small Creators look expensive per view and are capped below real market rates when Target CPM is low. The $10 floor keeps them biddable, but they'll score low.
- **The constants are judgement calls.** The weights (0.6/0.4, 0.75/0.25), the fit cap of 5, the 3× ceiling and the $10 floor aren't fitted to data. In production I'd tune them on delivered views, bids and wins, shipped as a new Scoring Version (every closed Campaign records which version judged it).
- **Engagement counts twice**, once in Estimated Impressions and again in the Score.
- **Greedy can leave Budget unspent**, or pick one large Bid where two smaller ones would have delivered more.
- **Ranking leans on Target CPM.** Within one Creator's list, the payout factor is effectively "sort by Target CPM", and bigger Creators get lower Budget Fit.
- **No verification of profiles.** Followers and engagement are taken at face value; a real system would pull them from the platform APIs.
- **Deliberately not built:** authentication, editing or withdrawing Bids, editing Campaigns after creation, pagination, delivery tracking and payments.

## Production

None of this is provisioned; it's how I'd run it. What's actually in the repo is the production `Dockerfile`, the health endpoints, the compose `prod` profile and the CI image build (see [Production images locally](#production-images-locally)). The reasoning is in [ADR 0011](docs/adr/0011-production-images-and-deployment.md) and [ADR 0007](docs/adr/0007-postgres-poll-loop-closing-worker.md).

### Deployment

One multi-stage `Dockerfile` builds two images: **api** (which also serves the built web app, so there's one origin and no CORS) and **worker**. Both run as a non-root user with node as PID 1, so SIGTERM drains cleanly. I'd run them on **AWS ECS Fargate**:

- an ALB in front of two or more api tasks, health-checked on `/readyz`
- two worker tasks (safe, see Scheduled jobs)
- CI builds, tags and pushes images to ECR, then runs migrations and rolls the services

Two small services don't justify Kubernetes, and Fargate keeps it managed without hiding how things run.

### Database

**RDS Postgres 18**, Multi-AZ, with point-in-time recovery. Migrations are plain SQL files run as a one-off task (`node packages/db/src/migrate.ts`) before each deploy, never on boot. Because old tasks keep serving during a rolling deploy, schema changes follow expand → deploy → contract. I'd add RDS Proxy once several services' connection pools start adding up.

### Scheduled jobs

The worker is a long-running poll loop rather than a cron job: every 5 seconds it closes every Campaign past its deadline. Each Campaign closes in its own transaction:

1. `SELECT … FOR UPDATE SKIP LOCKED` grabs one due Campaign
2. load its Bids and run the pure `closeCampaign`
3. write the outcomes and mark it Closed (only if it's still Open)

That makes overlapping and repeated runs safe. Two workers never grab the same Campaign, a crash just rolls back and the next tick retries, and a Campaign can't be closed twice. Bid placement takes a shared lock on the same row, so a Bid either lands before Closing or is rejected, regardless of clock skew. Postgres already does all of this, so there's no Redis or queue to run.

### Configuration and secrets

All config comes from environment variables and is validated with Zod at startup, so a misconfigured task fails immediately instead of at the first request. In AWS, `DATABASE_URL` and other secrets come from **Secrets Manager** into the task environment; nothing secret is baked into images or the repo.

### Observability

- **Logs:** structured JSON (pino) to CloudWatch. Every request has an `x-request-id` that also appears in error responses, and the worker logs every close (Winners, spend) and every failure under a per-tick run id.
- **Health:** `/healthz` for liveness, `/readyz` checks the database.
- **Alerts:** the key one is **closing lag** (the oldest Open Campaign past its deadline), alerted above 60 seconds. It catches a crashed, hung or overloaded worker from the outside. Plus ALB 5xx rate and p95 latency.
- **Next step:** OpenTelemetry tracing across api and database.

### Error handling

The API returns `application/problem+json` with a stable error `code` (`fee_out_of_range`, `deadline_passed`, …) and the right HTTP status, and the web app maps codes to messages. Unexpected errors become a generic 500 with the request id and never leak internals. In the worker, a Campaign that fails to close is logged, skipped for the rest of that tick and retried on the next one, so one bad Campaign can't block the others.

### Scaling

The api is stateless, so it scales horizontally behind the ALB. The worker scales by adding tasks thanks to `SKIP LOCKED`, though one is plenty until thousands of Campaigns close at the same moment. Beyond that I'd add, in order: pagination on list endpoints, a CDN for the static web assets, read replicas for the Matched Campaigns query, and precomputed matching if the Creator base gets large.

### Reliability

- Business rules are pure, deterministic functions with unit tests; the database layer and closing worker have integration tests against real Postgres; CI runs all of it plus a migration drift check and both Docker builds.
- Closing is idempotent and judged on immutable Bid Snapshots, so retries and replays give the same result.
- Database CHECKs back up the invariants (spend within Budget, Closed ⇔ `closed_at`, Lost ⇔ Loss Reason).
- Multi-AZ RDS with PITR, two or more tasks per service, and graceful shutdown on deploys.
- What I'd add next: an outbox for notifying Creators of outcomes, idempotency keys on Bid placement, and real authentication.
