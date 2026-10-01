# Local infra: compose runs Postgres only, apps run on the host

`compose.yaml` runs a single `postgres:18` service, and an init script creates `wepush_test` next to `wepush`. The apps run on the host, so `node --watch` and Vite reload fast without bind mounts or `node_modules` trouble. There's one root `.env`, loaded with Node's native `--env-file-if-exists` (no dotenv; real env vars win in prod). Each process validates its env at startup with a Zod `loadConfig`, which exits 1 and lists every issue on failure. `TZ=UTC` is asserted. Web has no env: Vite proxies `/api` to the api port, which it reads from the root `.env`.

`pnpm dev` runs `infra:up` (compose `--wait`), then `db:migrate`, then all three apps. Migrating is always an explicit step. Production images are covered in ADR 0011.
