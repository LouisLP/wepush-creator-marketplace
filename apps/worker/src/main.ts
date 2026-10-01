import process from 'node:process'
import { createDb, createUnitOfWork } from '@wepush/db'
import pino from 'pino'
import { closeNextDue } from './close-campaigns.ts'
import { loadConfig } from './config.ts'
import { runLoop, sleep } from './loop.ts'

const config = loadConfig()
const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === 'production' ? undefined : { target: 'pino-pretty' },
})
const { db, pool } = createDb(config.databaseUrl, { max: config.dbPoolMax })
const deps = { uow: createUnitOfWork(db), clock: { now: () => new Date() } }

const controller = new AbortController()
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    logger.info({ signal }, 'shutting down')
    controller.abort()
  })
}

logger.info({ intervalMs: config.pollIntervalMs }, 'worker started')
await runLoop({
  closeNextDue: exclude => closeNextDue(deps, exclude),
  sleep,
  signal: controller.signal,
  logger,
  intervalMs: config.pollIntervalMs,
})
await pool.end()
logger.info('worker stopped')
