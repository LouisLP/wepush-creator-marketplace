import type { Db, DbExecutor } from './client.ts'
import { createAdvertiserRepo } from './repos/advertisers.ts'
import { createBidRepo } from './repos/bids.ts'
import { createCampaignRepo } from './repos/campaigns.ts'
import { createCreatorRepo } from './repos/creators.ts'

export function createRepos(exec: DbExecutor) {
  return {
    advertisers: createAdvertiserRepo(exec),
    creators: createCreatorRepo(exec),
    campaigns: createCampaignRepo(exec),
    bids: createBidRepo(exec),
  }
}
export type Repos = ReturnType<typeof createRepos>

export function createUnitOfWork(db: Db) {
  return {
    run: <T>(fn: (repos: Repos) => Promise<T>): Promise<T> =>
      db.transaction(tx => fn(createRepos(tx))),
  }
}
export type UnitOfWork = ReturnType<typeof createUnitOfWork>
