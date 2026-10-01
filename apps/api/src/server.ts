import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createDb, createRepos, createUnitOfWork, ping } from '@wepush/db'
import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'

const config = loadConfig()
const { db, pool } = createDb(config.databaseUrl, { max: config.dbPoolMax })

const isProd = config.nodeEnv === 'production'

const app = await buildApp(
  {
    repos: createRepos(db),
    uow: createUnitOfWork(db),
    clock: { now: () => new Date() },
    pingDb: () => ping(db),
  },
  {
    docs: !isProd,
    webRoot: isProd ? fileURLToPath(new URL('../../web/dist', import.meta.url)) : undefined,
    logger: {
      level: config.logLevel,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      transport: isProd ? undefined : { target: 'pino-pretty' },
    },
  },
)
app.addHook('onClose', () => pool.end())

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, 'shutting down')
    await app.close()
    process.exit(0)
  })
}

await app.listen({ host: config.host, port: config.port })
