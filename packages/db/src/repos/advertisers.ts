import type { AdvertiserId } from '@wepush/domain'
import type { DbExecutor } from '../client.ts'
import { asc, eq } from 'drizzle-orm'
import { advertisers } from '../schema/index.ts'

type Row = typeof advertisers.$inferSelect

function toAdvertiser(row: Row) {
  return {
    id: row.id as AdvertiserId,
    name: row.name,
    createdAt: row.createdAt,
  }
}
export type Advertiser = ReturnType<typeof toAdvertiser>

export function createAdvertiserRepo(exec: DbExecutor) {
  return {
    async list() {
      const rows = await exec.select().from(advertisers).orderBy(asc(advertisers.name), asc(advertisers.id))
      return rows.map(toAdvertiser)
    },

    async getById(id: string) {
      const [row] = await exec.select().from(advertisers).where(eq(advertisers.id, id))
      return row && toAdvertiser(row)
    },

    async create(input: { name: string }) {
      const [row] = await exec.insert(advertisers).values(input).returning()
      return toAdvertiser(row!)
    },
  }
}
export type AdvertiserRepo = ReturnType<typeof createAdvertiserRepo>
