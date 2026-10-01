# syntax=docker/dockerfile:1

# No `pnpm deploy`: it moves @wepush/* under node_modules, where Node refuses to strip types.
# Each runtime stage keeps the workspace layout and installs only its app's prod deps (ADR 0011).

FROM node:24.21.0-bookworm-slim AS base
ENV CI=true TZ=UTC
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/contracts/package.json packages/contracts/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/

FROM base AS web-build
RUN pnpm install --frozen-lockfile --filter @wepush/web...
COPY tsconfig.base.json ./
COPY packages/domain/src packages/domain/src
COPY packages/contracts/src packages/contracts/src
COPY apps/web apps/web
RUN pnpm --filter @wepush/web build

FROM base AS api-deps
RUN pnpm install --prod --frozen-lockfile --filter @wepush/api...

FROM base AS worker-deps
RUN pnpm install --prod --frozen-lockfile --filter @wepush/worker...

FROM node:24.21.0-bookworm-slim AS runtime
ENV NODE_ENV=production TZ=UTC
WORKDIR /app

FROM runtime AS api
ENV API_HOST=0.0.0.0 API_PORT=3000
COPY --from=api-deps /app ./
COPY packages/domain/src packages/domain/src
COPY packages/contracts/src packages/contracts/src
COPY packages/db/src packages/db/src
COPY packages/db/migrations packages/db/migrations
COPY apps/api/src apps/api/src
COPY --from=web-build /app/apps/web/dist apps/web/dist
USER node
EXPOSE 3000
CMD ["node", "apps/api/src/server.ts"]

FROM runtime AS worker
COPY --from=worker-deps /app ./
COPY packages/domain/src packages/domain/src
COPY packages/db/src packages/db/src
COPY apps/worker/src apps/worker/src
USER node
CMD ["node", "apps/worker/src/main.ts"]
