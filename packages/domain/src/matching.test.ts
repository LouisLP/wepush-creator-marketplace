import type { CampaignId, CampaignTerms, CreatorProfile } from './types.ts'
import { describe, expect, it } from 'vitest'
import { canReviewCampaign, checkRequirements, isMatchedCampaign } from './matching.ts'
import { cents } from './types.ts'

const creator: CreatorProfile = { platform: 'tiktok', category: 'food', followers: 10_000, engagementRate: 0.04 }

const terms: CampaignTerms = {
  id: 'c1' as CampaignId,
  requirements: { platform: 'tiktok', categories: ['food', 'travel'], minFollowers: 10_000, minEngagementRate: 0.04 },
  budgetCents: cents(100_000),
  targetCpmCents: cents(1_000),
  biddingDeadline: new Date('2026-01-02T00:00:00Z'),
}

const before = new Date('2026-01-01T00:00:00Z')

describe('checkRequirements', () => {
  it('passes thresholds met exactly', () => {
    expect(checkRequirements(creator, terms.requirements)).toEqual([
      { requirement: 'platform', passed: true, actual: 'tiktok', required: 'tiktok' },
      { requirement: 'category', passed: true, actual: 'food', required: ['food', 'travel'] },
      { requirement: 'minFollowers', passed: true, actual: 10_000, required: 10_000 },
      { requirement: 'minEngagement', passed: true, actual: 0.04, required: 0.04 },
    ])
  })

  it('reports each Requirement the profile misses', () => {
    const checks = checkRequirements(
      { platform: 'instagram', category: 'tech', followers: 9_999, engagementRate: 0.039 },
      terms.requirements,
    )
    expect(checks.map(c => [c.requirement, c.passed])).toEqual([
      ['platform', false],
      ['category', false],
      ['minFollowers', false],
      ['minEngagement', false],
    ])
  })

  it('passes any engagement when the Campaign sets no minimum', () => {
    const checks = checkRequirements({ ...creator, engagementRate: 0 }, { ...terms.requirements, minEngagementRate: null })
    expect(checks.at(-1)).toEqual({ requirement: 'minEngagement', passed: true, actual: 0, required: null })
  })
})

describe('isMatchedCampaign', () => {
  it('matches an Open Campaign before its deadline whose Requirements are all met', () => {
    expect(isMatchedCampaign(creator, { status: 'open', terms }, before)).toBe(true)
  })

  it('does not match a Closed Campaign', () => {
    expect(isMatchedCampaign(creator, { status: 'closed', terms }, before)).toBe(false)
  })

  it('stops matching at the Bidding Deadline', () => {
    expect(isMatchedCampaign(creator, { status: 'open', terms }, terms.biddingDeadline)).toBe(false)
  })

  it('does not match when a single Requirement is missed', () => {
    expect(isMatchedCampaign({ ...creator, followers: 9_999 }, { status: 'open', terms }, before)).toBe(false)
  })
})

describe('canReviewCampaign', () => {
  const closed = { status: 'closed', terms } as const

  it('allows a Matched Campaign without a Bid', () => {
    expect(canReviewCampaign(creator, { status: 'open', terms }, false, before)).toBe(true)
  })

  it('hides an unmatched Campaign without a Bid', () => {
    expect(canReviewCampaign(creator, closed, false, before)).toBe(false)
  })

  it('keeps a Campaign reviewable once bid on, even after it stops matching', () => {
    expect(canReviewCampaign({ ...creator, followers: 0 }, closed, true, before)).toBe(true)
  })
})
