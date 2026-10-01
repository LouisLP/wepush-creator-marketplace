import type { LossReason } from './enums.ts'
import type { BidOutcome, CampaignTerms, ClosingOutcome, Factor, PendingBid } from './types.ts'
import { PLATFORM_BENCHMARKS } from './benchmarks.ts'
import { weighFactors } from './factors.ts'
import { meetsAudienceThresholds } from './matching.ts'
import { clamp, round2 } from './math.ts'
import { feeRange, isWithinFeeRange } from './pricing.ts'
import { cents } from './types.ts'

export const SCORING_VERSION = 'v1'

export const SCORE_WEIGHTS = { cpm_fit: 0.75, engagement: 0.25 } as const

export type ScoreFactorKey = keyof typeof SCORE_WEIGHTS

export interface BidScore {
  score: number
  factors: Factor<ScoreFactorKey>[]
}

export function scoreBid(campaign: CampaignTerms, bid: PendingBid): BidScore {
  const { baselineEngagementRate } = PLATFORM_BENCHMARKS[campaign.requirements.platform]
  const values: Record<ScoreFactorKey, number> = {
    cpm_fit: clamp(campaign.targetCpmCents / bid.snapshot.effectiveCpmCents, 0, 2) / 2,
    engagement: clamp(bid.snapshot.engagementRate / baselineEngagementRate, 0, 2) / 2,
  }
  const { factors, total } = weighFactors(SCORE_WEIGHTS, values)
  return { score: round2(total), factors }
}

/** The first eligibility gate a Bid fails, judged on its Bid Snapshot; null if Eligible. */
function ineligibility(campaign: CampaignTerms, bid: PendingBid): LossReason | null {
  if (!meetsAudienceThresholds(bid.snapshot, campaign.requirements))
    return 'requirements_not_met'
  if (!isWithinFeeRange(bid.feeCents, feeRange(bid.snapshot.estimatedImpressions, campaign)))
    return 'fee_out_of_range'
  return null
}

export function closeCampaign(campaign: CampaignTerms, bids: PendingBid[]): ClosingOutcome {
  const ranked = bids
    .map(bid => ({ bid, ineligible: ineligibility(campaign, bid), ...scoreBid(campaign, bid) }))
    .sort((a, b) =>
      Number(a.ineligible !== null) - Number(b.ineligible !== null)
      || b.score - a.score
      || a.bid.feeCents - b.bid.feeCents
      || a.bid.placedAt.getTime() - b.bid.placedAt.getTime()
      || a.bid.id.localeCompare(b.bid.id),
    )

  let remaining: number = campaign.budgetCents
  const outcomes: BidOutcome[] = ranked.map(({ bid, ineligible, score, factors }, i) => {
    const base = { bidId: bid.id, score, rank: i + 1, factors }
    if (ineligible)
      return { ...base, status: 'lost', lossReason: ineligible, remainingBudgetCents: null }

    const remainingBudgetCents = cents(remaining)
    if (bid.feeCents > remaining)
      return { ...base, status: 'lost', lossReason: 'over_budget', remainingBudgetCents }
    remaining -= bid.feeCents
    return { ...base, status: 'won', lossReason: null, remainingBudgetCents }
  })

  return { scoringVersion: SCORING_VERSION, spentCents: cents(campaign.budgetCents - remaining), outcomes }
}
