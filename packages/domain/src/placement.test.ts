import type { CampaignState } from './matching.ts'
import type { PlacementInput } from './placement.ts'
import type { CampaignId, CreatorProfile } from './types.ts'
import { describe, expect, it } from 'vitest'
import { checkBidPlacement } from './placement.ts'
import { cents } from './types.ts'

const creator: CreatorProfile = { platform: 'tiktok', category: 'food', followers: 50_000, engagementRate: 0.05 }

const campaign: CampaignState = {
  status: 'open',
  terms: {
    id: 'c1' as CampaignId,
    requirements: { platform: 'tiktok', categories: ['food'], minFollowers: 10_000, minEngagementRate: null },
    budgetCents: cents(100_000),
    targetCpmCents: cents(1_000),
    biddingDeadline: new Date('2026-01-02T00:00:00Z'),
  },
}

function input(overrides: Partial<PlacementInput> = {}): PlacementInput {
  return { creator, campaign, feeCents: cents(6_000), now: new Date('2026-01-01T00:00:00Z'), alreadyBid: false, ...overrides }
}

describe('checkBidPlacement', () => {
  it('returns the Bid Snapshot for a valid Bid', () => {
    expect(checkBidPlacement(input())).toEqual({
      ok: true,
      value: { followers: 50_000, engagementRate: 0.05, estimatedImpressions: 7_500, effectiveCpmCents: 800 },
    })
  })

  it('accepts Fees at both ends of the Fee Range', () => {
    expect(checkBidPlacement(input({ feeCents: cents(1_000) })).ok).toBe(true)
    expect(checkBidPlacement(input({ feeCents: cents(22_500) })).ok).toBe(true)
  })

  it('rejects a Fee outside the Fee Range with the range', () => {
    const error = { code: 'fee_out_of_range', minCents: 1_000, maxCents: 22_500 }
    expect(checkBidPlacement(input({ feeCents: cents(999) }))).toEqual({ ok: false, error })
    expect(checkBidPlacement(input({ feeCents: cents(22_501) }))).toEqual({ ok: false, error })
  })

  it('rejects a Creator who misses a Requirement with every check', () => {
    const result = checkBidPlacement(input({ creator: { ...creator, followers: 9_000 } }))
    expect(result).toMatchObject({ ok: false, error: { code: 'requirements_not_met' } })
    expect(!result.ok && result.error.code === 'requirements_not_met' && result.error.checks).toHaveLength(4)
  })

  it('rejects a second Bid on the same Campaign', () => {
    expect(checkBidPlacement(input({ alreadyBid: true }))).toEqual({ ok: false, error: { code: 'already_bid' } })
  })

  it('rejects at and after the Bidding Deadline', () => {
    expect(checkBidPlacement(input({ now: campaign.terms.biddingDeadline }))).toEqual({ ok: false, error: { code: 'deadline_passed' } })
  })

  it('rejects a Closed Campaign before any other check', () => {
    const result = checkBidPlacement(input({
      campaign: { ...campaign, status: 'closed' },
      now: campaign.terms.biddingDeadline,
      alreadyBid: true,
      feeCents: cents(1),
    }))
    expect(result).toEqual({ ok: false, error: { code: 'campaign_closed' } })
  })
})
