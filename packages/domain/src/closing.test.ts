import type { BidId, CampaignId, CampaignTerms, CreatorId, PendingBid } from './types.ts'
import { describe, expect, it } from 'vitest'
import { closeCampaign, SCORING_VERSION } from './closing.ts'
import { cents } from './types.ts'

const campaign: CampaignTerms = {
  id: 'c1' as CampaignId,
  requirements: { platform: 'tiktok', categories: ['food'], minFollowers: 0, minEngagementRate: null },
  budgetCents: cents(10_000),
  targetCpmCents: cents(1_000),
  biddingDeadline: new Date('2026-01-01T00:00:00Z'),
}

function bid(id: string, feeCents: number, placedAt: string): PendingBid {
  return {
    id: id as BidId,
    creatorId: `creator-${id}` as CreatorId,
    feeCents: cents(feeCents),
    snapshot: { followers: 1000, engagementRate: 0.05, estimatedImpressions: 500, effectiveCpmCents: cents(1000) },
    placedAt: new Date(placedAt),
  }
}

describe('closeCampaign', () => {
  it('selects bids in order while they fit the budget', () => {
    const outcome = closeCampaign(campaign, [
      bid('b', 6_000, '2025-12-01T00:00:02Z'),
      bid('a', 5_000, '2025-12-01T00:00:01Z'),
      bid('c', 4_000, '2025-12-01T00:00:03Z'),
    ])

    expect(outcome.scoringVersion).toBe(SCORING_VERSION)
    expect(outcome.spentCents).toBe(9_000)
    expect(outcome.outcomes.map(o => [o.bidId, o.rank, o.status, o.lossReason])).toEqual([
      ['a', 1, 'won', null],
      ['b', 2, 'lost', 'over_budget'],
      ['c', 3, 'won', null],
    ])
  })

  it('closes with no winners when there are no bids', () => {
    expect(closeCampaign(campaign, [])).toEqual({ scoringVersion: SCORING_VERSION, spentCents: 0, outcomes: [] })
  })
})
