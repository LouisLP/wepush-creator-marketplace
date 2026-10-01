import process from 'node:process'
import { z } from 'zod'

const ConfigSchema = z.object({
  DATABASE_URL: z.url(),
  TZ: z.literal('UTC'),
})

export type Config = Readonly<{ databaseUrl: string }>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = ConfigSchema.safeParse(env)
  if (!parsed.success) {
    console.error(`Invalid configuration:\n${z.prettifyError(parsed.error)}`)
    process.exit(1)
  }
  return Object.freeze({ databaseUrl: parsed.data.DATABASE_URL })
}
