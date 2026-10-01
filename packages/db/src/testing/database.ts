import type { Db } from '../client.ts'
import process from 'node:process'
import { getTableName, is, sql } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import * as schema from '../schema/index.ts'

export function testDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.TEST_DATABASE_URL
  if (!url)
    throw new Error('TEST_DATABASE_URL is not set')
  const name = new URL(url).pathname.slice(1)
  if (!name.endsWith('_test'))
    throw new Error(`Refusing to run tests against "${name}": database name must end in _test`)
  return url
}

const tableNames = Object.values(schema)
  .filter(value => is(value, PgTable))
  .map(table => `"${getTableName(table)}"`)

export async function resetDb(db: Db) {
  await db.execute(sql.raw(`TRUNCATE ${tableNames.join(', ')} RESTART IDENTITY CASCADE`))
}
