# Production: two images from one Dockerfile, AWS described not provisioned

One root multi-stage `Dockerfile` on a pinned `node:24-slim` produces two images: `api` and `worker`. The api image also contains web's Vite `dist` and serves it with `@fastify/static` plus an SPA fallback, so production is one origin and the web client's relative `/api` calls work unchanged. Migrations run from the api image as a one-off command (`node packages/db/src/migrate.ts`), never on boot.

We don't use `pnpm deploy`. It copies workspace packages under `node_modules`, and Node refuses to strip types there (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`). Each runtime stage keeps the workspace layout instead: it copies the manifests and lockfile, runs `pnpm install --prod --frozen-lockfile --filter @wepush/<app>...`, then copies only the `src` that app needs (plus `packages/db/migrations` for api). The symlinks still resolve outside `node_modules`, so ADR 0002's no-build stance holds. Images run as the non-root `node` user with `NODE_ENV=production`, `TZ=UTC`, `API_HOST=0.0.0.0` and an exec-form `CMD`, so node is PID 1 and our SIGTERM handlers drain.

What we build in the repo:

- the Dockerfile and `.dockerignore`
- `/healthz` (liveness) and `/readyz` (`SELECT 1`) on api
- a compose `prod` profile that runs migrate → api → worker from the images against the local Postgres
- a CI step that runs `docker build` for both targets, with no push

Everything else lives only in the README. It targets ECS Fargate:

- An ALB fronts api (two or more tasks, health-checked).
- The worker runs as two tasks, which is safe because of ADR 0007's row locks.
- Migrations run as a `run-task` before each service update and follow expand/contract, because old tasks keep serving during a rolling deploy.
- The database is RDS Postgres 18 Multi-AZ with PITR, plus RDS Proxy once replica pools add up.
- Secrets go from Secrets Manager into task env and are validated by the existing `loadConfig`.
- Observability:
  - pino JSON logs → CloudWatch
  - a "closing lag" SLI (oldest open Campaign past its deadline) alerted above 60s
  - ALB 5xx rate and p95
  - OpenTelemetry tracing as the next step

Nothing gets provisioned and there's no IaC.

## Considered options

- **Bundling to JS (esbuild/tsdown) + `pnpm deploy`**: smaller images, but it adds a build step and would supersede ADR 0002.
- **A separate nginx/caddy web image proxying `/api`**: one more service and more config, with no benefit at this size. A CDN in front of the static assets is the real scaling step.
- **One image with three commands**: fatter images and no per-app isolation.
- **Kubernetes, or a PaaS such as Fly/Render**: k8s is heavy for two services, and a PaaS reads as less production-minded.
- **A worker heartbeat file or a `/metrics` endpoint**: the closing-lag SLI catches a hung or crashed worker from the outside without extra code.
- **distroless or alpine**: harder to debug, and musl risks friction with native deps.
