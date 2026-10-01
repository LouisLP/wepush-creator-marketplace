import type { CreatorBid, MyBid, ScoreFactor } from '@wepush/contracts'
import type { Bid } from '@wepush/db'

/** `scoringVersion` comes from the Campaign's outcome; only read once the Bid has one. */
export function toCreatorBid(b: Bid, scoringVersion?: string): CreatorBid {
  return {
    id: b.id,
    feeCents: b.feeCents,
    status: b.status,
    placedAt: b.placedAt.toISOString(),
    snapshot: b.snapshot,
    outcome: b.outcome && {
      rank: b.outcome.rank,
      score: b.outcome.score,
      factors: b.outcome.factors as ScoreFactor[],
      scoringVersion: scoringVersion!,
      lossReason: b.outcome.lossReason,
      remainingBudgetCents: b.outcome.remainingBudgetCents,
    },
  }
}

export function toMyBid(b: Bid & { campaignTitle: string, biddingDeadline: Date }): MyBid {
  return {
    id: b.id,
    campaignId: b.campaignId,
    campaignTitle: b.campaignTitle,
    feeCents: b.feeCents,
    status: b.status,
    rank: b.outcome?.rank ?? null,
    biddingDeadline: b.biddingDeadline.toISOString(),
  }
}
