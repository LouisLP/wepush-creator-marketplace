import { runMigrations } from '../migrate.ts'
import { testDatabaseUrl } from './database.ts'

export default async function setup() {
  await runMigrations(testDatabaseUrl())
}
