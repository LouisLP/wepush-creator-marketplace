import { createDb, ping } from '../client.ts'
import { createRepos, createUnitOfWork } from '../uow.ts'
import { createFakeClock } from './clock.ts'
import { resetDb, testDatabaseUrl } from './database.ts'

export * from './clock.ts'
export { resetDb, testDatabaseUrl } from './database.ts'
export * from './fixtures.ts'

export function createTestContext() {
  const { db, pool } = createDb(testDatabaseUrl(), { max: 5 })
  return {
    db,
    pool,
    repos: createRepos(db),
    uow: createUnitOfWork(db),
    clock: createFakeClock(),
    pingDb: () => ping(db),
    reset: () => resetDb(db),
    close: () => pool.end(),
  }
}
export type TestContext = ReturnType<typeof createTestContext>
