import type { CampaignState, RequirementCheck } from './matching.ts'
import type { Result } from './result.ts'
import type { BidSnapshot, Cents, CreatorProfile } from './types.ts'
import { checkRequirements } from './matching.ts'
import { effectiveCpmCents, estimateImpressions, feeRange, isWithinFeeRange } from './pricing.ts'
import { err, ok } from './result.ts'

export interface PlacementInput {
  creator: CreatorProfile
  campaign: CampaignState
  feeCents: Cents
  now: Date
  alreadyBid: boolean
}

export type PlacementError
  = | { code: 'campaign_closed' }
    | { code: 'deadline_passed' }
    | { code: 'already_bid' }
    | { code: 'requirements_not_met', checks: RequirementCheck[] }
    | { code: 'fee_out_of_range', minCents: Cents, maxCents: Cents }

/** On success, returns the Bid Snapshot to persist with the Bid. */
export function checkBidPlacement({ creator, campaign, feeCents, now, alreadyBid }: PlacementInput): Result<BidSnapshot, PlacementError> {
  const { terms } = campaign
  if (campaign.status !== 'open')
    return err({ code: 'campaign_closed' })
  if (now >= terms.biddingDeadline)
    return err({ code: 'deadline_passed' })
  if (alreadyBid)
    return err({ code: 'already_bid' })

  const checks = checkRequirements(creator, terms.requirements)
  if (!checks.every(c => c.passed))
    return err({ code: 'requirements_not_met', checks })

  const estimatedImpressions = estimateImpressions(creator)
  const range = feeRange(estimatedImpressions, terms)
  if (!isWithinFeeRange(feeCents, range))
    return err({ code: 'fee_out_of_range', ...range })

  return ok({
    followers: creator.followers,
    engagementRate: creator.engagementRate,
    estimatedImpressions,
    effectiveCpmCents: effectiveCpmCents(feeCents, estimatedImpressions),
  })
}
