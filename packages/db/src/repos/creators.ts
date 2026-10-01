import type { CreatorId, CreatorProfile } from '@wepush/domain'
import type { DbExecutor } from '../client.ts'
import { asc, eq } from 'drizzle-orm'
import { translatingDbErrors } from '../errors.ts'
import { creators } from '../schema/index.ts'

type Row = typeof creators.$inferSelect

function toCreator(row: Row) {
  return {
    id: row.id as CreatorId,
    handle: row.handle,
    profile: {
      platform: row.platform,
      category: row.category,
      followers: row.followers,
      engagementRate: row.engagementRate,
    } satisfies CreatorProfile,
    createdAt: row.createdAt,
  }
}
export type Creator = ReturnType<typeof toCreator>

export function createCreatorRepo(exec: DbExecutor) {
  return {
    async list() {
      const rows = await exec.select().from(creators).orderBy(asc(creators.handle))
      return rows.map(toCreator)
    },

    async getById(id: string) {
      const [row] = await exec.select().from(creators).where(eq(creators.id, id))
      return row && toCreator(row)
    },

    async create(input: { handle: string } & CreatorProfile) {
      const [row] = await translatingDbErrors(() => exec.insert(creators).values(input).returning())
      return toCreator(row!)
    },
  }
}
export type CreatorRepo = ReturnType<typeof createCreatorRepo>
