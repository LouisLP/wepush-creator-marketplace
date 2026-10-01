import process from 'node:process'
import { z } from 'zod'

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  TZ: z.literal('UTC'),
  DATABASE_URL: z.url(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
}).transform(env => ({
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  databaseUrl: env.DATABASE_URL,
  dbPoolMax: env.DB_POOL_MAX,
  host: env.API_HOST,
  port: env.API_PORT,
}))

export type Config = Readonly<z.output<typeof ConfigSchema>>

export function parseConfig(env: NodeJS.ProcessEnv) {
  return ConfigSchema.safeParse(env)
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = parseConfig(env)
  if (!parsed.success) {
    console.error(`Invalid configuration:\n${z.prettifyError(parsed.error)}`)
    process.exit(1)
  }
  return Object.freeze(parsed.data)
}
