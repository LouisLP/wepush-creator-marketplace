import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema/index.ts'

export interface DbOptions {
  max?: number
}

export function createDb(url: string, opts: DbOptions = {}) {
  const pool = new pg.Pool({
    connectionString: url,
    max: opts.max ?? 10,
    options: '-c statement_timeout=10000 -c idle_in_transaction_session_timeout=30000',
  })
  const db = drizzle({ client: pool, schema, casing: 'snake_case' })
  return { db, pool }
}

export type Db = ReturnType<typeof createDb>['db']
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
export type DbExecutor = Db | Tx

export async function ping(db: Db) {
  await db.execute(sql`select 1`)
}
