import type { AdvertiserId, CampaignId, CampaignTerms, Cents } from '@wepush/domain'
import type { DbExecutor } from '../client.ts'
import { and, asc, desc, eq, lte, notInArray } from 'drizzle-orm'
import { campaigns } from '../schema/index.ts'

type Row = typeof campaigns.$inferSelect

function toCampaign(row: Row) {
  return {
    id: row.id as CampaignId,
    advertiserId: row.advertiserId as AdvertiserId,
    title: row.title,
    brief: row.brief,
    status: row.status,
    terms: {
      id: row.id as CampaignId,
      requirements: {
        platform: row.platform,
        categories: row.categories,
        minFollowers: row.minFollowers,
        minEngagementRate: row.minEngagementRate,
      },
      budgetCents: row.budgetCents as Cents,
      targetCpmCents: row.targetCpmCents as Cents,
      biddingDeadline: row.biddingDeadline,
    } satisfies CampaignTerms,
    outcome: row.closedAt && {
      closedAt: row.closedAt,
      spentCents: row.spentCents as Cents,
      scoringVersion: row.scoringVersion!,
    },
    createdAt: row.createdAt,
  }
}
export type Campaign = ReturnType<typeof toCampaign>

export function createCampaignRepo(exec: DbExecutor) {
  return {
    async listByAdvertiser(advertiserId: AdvertiserId) {
      const rows = await exec.select().from(campaigns).where(eq(campaigns.advertiserId, advertiserId)).orderBy(desc(campaigns.createdAt), desc(campaigns.id))
      return rows.map(toCampaign)
    },

    async getById(id: CampaignId) {
      const [row] = await exec.select().from(campaigns).where(eq(campaigns.id, id))
      return row && toCampaign(row)
    },

    /** Locks the next due open campaign; concurrent claimers skip it. Call inside a transaction. */
    async claimNextDue(now: Date, exclude: readonly CampaignId[] = []) {
      const [row] = await exec.select().from(campaigns).where(and(
        eq(campaigns.status, 'open'),
        lte(campaigns.biddingDeadline, now),
        exclude.length ? notInArray(campaigns.id, [...exclude]) : undefined,
      )).orderBy(asc(campaigns.biddingDeadline), asc(campaigns.id)).limit(1).for('update', { skipLocked: true })
      return row && toCampaign(row)
    },

    async markClosed(input: { id: CampaignId, spentCents: Cents, closedAt: Date, scoringVersion: string }) {
      const updated = await exec.update(campaigns)
        .set({ status: 'closed', spentCents: input.spentCents, closedAt: input.closedAt, scoringVersion: input.scoringVersion })
        .where(and(eq(campaigns.id, input.id), eq(campaigns.status, 'open')))
        .returning({ id: campaigns.id })
      if (updated.length !== 1)
        throw new Error(`markClosed expected 1 open campaign ${input.id}, updated ${updated.length}`)
    },
  }
}
export type CampaignRepo = ReturnType<typeof createCampaignRepo>
