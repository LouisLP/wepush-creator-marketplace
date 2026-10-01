import type { CreatorBid, MyBid, ScoreFactor } from '@wepush/contracts'
import type { Bid, BidWithCampaign } from '@wepush/db'

/** `scoringVersion` is the Campaign's; Closing writes it in the same transaction as the Bid's outcome. */
export function toCreatorBid(b: Bid, scoringVersion: string | undefined): CreatorBid {
  if (b.outcome && scoringVersion === undefined)
    throw new Error(`Bid ${b.id} has an outcome but its Campaign has no Scoring Version`)
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

export function toMyBid(b: BidWithCampaign): MyBid {
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
