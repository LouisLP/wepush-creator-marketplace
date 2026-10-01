import type { BidId, BidOutcome, CampaignId, Cents, CreatorId, PendingBid } from '@wepush/domain'
import type { DbExecutor } from '../client.ts'
import { and, asc, eq } from 'drizzle-orm'
import { bids } from '../schema/index.ts'

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

export function createBidRepo(exec: DbExecutor) {
  return {
    async listPending(campaignId: CampaignId) {
      const rows = await exec.select().from(bids).where(and(eq(bids.campaignId, campaignId), eq(bids.status, 'pending'))).orderBy(asc(bids.placedAt), asc(bids.id))
      return rows.map(toPendingBid)
    },

    async recordOutcomes(outcomes: readonly BidOutcome[]) {
      for (const o of outcomes) {
        const updated = await exec.update(bids)
          .set({ status: o.status, score: o.score, rank: o.rank, lossReason: o.lossReason, scoreFactors: o.factors })
          .where(and(eq(bids.id, o.bidId), eq(bids.status, 'pending')))
          .returning({ id: bids.id })
        if (updated.length !== 1)
          throw new Error(`recordOutcomes expected pending bid ${o.bidId}`)
      }
    },
  }
}
export type BidRepo = ReturnType<typeof createBidRepo>
