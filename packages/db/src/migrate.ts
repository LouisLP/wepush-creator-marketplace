import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { createDb } from './client.ts'
import { loadConfig } from './config.ts'

const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url))

export async function runMigrations(url: string) {
  const { db, pool } = createDb(url, { max: 1 })
  try {
    await migrate(db, { migrationsFolder })
  }
  finally {
    await pool.end()
  }
}

if (import.meta.main) {
  const config = loadConfig()
  await runMigrations(config.databaseUrl)
  console.log('Migrations applied')
}
