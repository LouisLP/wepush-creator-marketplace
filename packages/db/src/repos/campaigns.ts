import type { AdvertiserId, CampaignId, CampaignTerms, Cents, CreatorId, Platform } from '@wepush/domain'
import type { DbExecutor } from '../client.ts'
import { and, asc, desc, eq, gt, lte, notExists, notInArray } from 'drizzle-orm'
import { advertisers, bids, campaigns } from '../schema/index.ts'

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

function toCampaignWithAdvertiser(row: { campaign: Row, advertiserName: string }) {
  return { ...toCampaign(row.campaign), advertiserName: row.advertiserName }
}
export type CampaignWithAdvertiser = ReturnType<typeof toCampaignWithAdvertiser>

export function createCampaignRepo(exec: DbExecutor) {
  const withAdvertiser = () => exec.select({ campaign: campaigns, advertiserName: advertisers.name })
    .from(campaigns)
    .innerJoin(advertisers, eq(advertisers.id, campaigns.advertiserId))

  return {
    async listByAdvertiser(advertiserId: AdvertiserId) {
      const rows = await exec.select().from(campaigns).where(eq(campaigns.advertiserId, advertiserId)).orderBy(desc(campaigns.createdAt), desc(campaigns.id))
      return rows.map(toCampaign)
    },

    async getById(id: CampaignId) {
      const [row] = await exec.select().from(campaigns).where(eq(campaigns.id, id))
      return row && toCampaign(row)
    },

    async getWithAdvertiser(id: CampaignId) {
      const [row] = await withAdvertiser().where(eq(campaigns.id, id))
      return row && toCampaignWithAdvertiser(row)
    },

    /**
     * Share-locks the campaign so Closing (which claims FOR UPDATE SKIP LOCKED) can't run
     * while a Bid is placed on it; waits out a Closing already underway. Call inside a transaction.
     */
    async lockForBidding(id: CampaignId) {
      const [row] = await exec.select().from(campaigns).where(eq(campaigns.id, id)).for('share')
      return row && toCampaign(row)
    },

    /** Open, pre-deadline campaigns on `platform` the creator hasn't bid on; Matching decides the rest. */
    async listMatchCandidates(input: { creatorId: CreatorId, platform: Platform, now: Date }) {
      const rows = await withAdvertiser().where(and(
        eq(campaigns.status, 'open'),
        gt(campaigns.biddingDeadline, input.now),
        eq(campaigns.platform, input.platform),
        notExists(exec.select({ id: bids.id }).from(bids).where(and(eq(bids.campaignId, campaigns.id), eq(bids.creatorId, input.creatorId)))),
      ))
      return rows.map(toCampaignWithAdvertiser)
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
