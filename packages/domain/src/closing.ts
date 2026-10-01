import type { BidOutcome, CampaignTerms, ClosingOutcome, PendingBid } from './types.ts'
import { cents } from './types.ts'

export const SCORING_VERSION = 'v0-skeleton'

// Skeleton placeholder: every Bid scores 0, so order falls to the tie-break.
// Real scoring arrives in Map 2 with a version bump.
function score(_campaign: CampaignTerms, _bid: PendingBid): number {
  return 0
}

export function closeCampaign(campaign: CampaignTerms, bids: PendingBid[]): ClosingOutcome {
  const ranked = bids
    .map(bid => ({ bid, score: score(campaign, bid) }))
    .sort((a, b) =>
      b.score - a.score
      || a.bid.placedAt.getTime() - b.bid.placedAt.getTime()
      || a.bid.id.localeCompare(b.bid.id),
    )

  let spent = 0
  const outcomes: BidOutcome[] = ranked.map(({ bid, score }, i) => {
    const fits = spent + bid.feeCents <= campaign.budgetCents
    if (fits)
      spent += bid.feeCents
    return {
      bidId: bid.id,
      score,
      rank: i + 1,
      status: fits ? 'won' : 'lost',
      lossReason: fits ? null : 'over_budget',
      factors: [],
    }
  })

  return { scoringVersion: SCORING_VERSION, spentCents: cents(spent), outcomes }
}
