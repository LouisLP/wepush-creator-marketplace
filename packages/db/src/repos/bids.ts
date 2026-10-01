import type { BidId, BidOutcome, CampaignId, Cents, CreatorId, PendingBid } from '@wepush/domain'
import type { DbExecutor } from '../client.ts'
import { and, asc, eq } from 'drizzle-orm'
import { bids, creators } from '../schema/index.ts'

type Row = typeof bids.$inferSelect

function toPendingBid(row: Row): PendingBid {
  return {
    id: row.id as BidId,
    creatorId: row.creatorId as CreatorId,
    feeCents: row.feeCents as Cents,
    placedAt: row.placedAt,
    snapshot: {
      followers: row.followers,
      engagementRate: row.engagementRate,
      estimatedImpressions: row.estimatedImpressions,
      effectiveCpmCents: row.effectiveCpmCents as Cents,
    },
  }
}

/** The outcome recorded at Closing; null while Pending. */
function toRecordedOutcome(row: Row): BidOutcome | null {
  if (row.status === 'pending')
    return null
  return {
    bidId: row.id as BidId,
    score: row.score!,
    rank: row.rank!,
    status: row.status,
    lossReason: row.lossReason,
    remainingBudgetCents: row.remainingBudgetCents as Cents | null,
    factors: row.scoreFactors!,
  }
}

export function createBidRepo(exec: DbExecutor) {
  return {
    async listPending(campaignId: CampaignId) {
      const rows = await exec.select().from(bids).where(and(eq(bids.campaignId, campaignId), eq(bids.status, 'pending'))).orderBy(asc(bids.placedAt), asc(bids.id))
      return rows.map(toPendingBid)
    },

    /** Every Bid on a Campaign with its Creator's handle and Category, and any recorded outcome. */
    async listForCampaign(campaignId: CampaignId) {
      const rows = await exec.select({ bid: bids, handle: creators.handle, category: creators.category })
        .from(bids)
        .innerJoin(creators, eq(creators.id, bids.creatorId))
        .where(eq(bids.campaignId, campaignId))
        .orderBy(asc(bids.placedAt), asc(bids.id))
      return rows.map(({ bid, handle, category }) => ({
        bid: toPendingBid(bid),
        handle,
        category,
        recorded: toRecordedOutcome(bid),
      }))
    },

    async exists(campaignId: CampaignId, creatorId: CreatorId) {
      const [row] = await exec.select({ id: bids.id }).from(bids).where(and(eq(bids.campaignId, campaignId), eq(bids.creatorId, creatorId)))
      return !!row
    },

    async recordOutcomes(outcomes: readonly BidOutcome[]) {
      for (const o of outcomes) {
        const updated = await exec.update(bids)
          .set({ status: o.status, score: o.score, rank: o.rank, lossReason: o.lossReason, remainingBudgetCents: o.remainingBudgetCents, scoreFactors: o.factors })
          .where(and(eq(bids.id, o.bidId), eq(bids.status, 'pending')))
          .returning({ id: bids.id })
        if (updated.length !== 1)
          throw new Error(`recordOutcomes expected pending bid ${o.bidId}`)
      }
    },
  }
}
export type BidRepo = ReturnType<typeof createBidRepo>
export type CampaignBid = Awaited<ReturnType<BidRepo['listForCampaign']>>[number]
