import type { CampaignId, CampaignTerms } from './types.ts'
import { describe, expect, it } from 'vitest'
import { effectiveCpmCents, estimateImpressions, feeQuote, feeRange } from './pricing.ts'
import { cents } from './types.ts'

function terms(overrides: Partial<CampaignTerms> = {}): CampaignTerms {
  return {
    id: 'c1' as CampaignId,
    requirements: { platform: 'tiktok', categories: ['food'], minFollowers: 0, minEngagementRate: null },
    budgetCents: cents(100_000),
    targetCpmCents: cents(1_000),
    biddingDeadline: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('estimateImpressions', () => {
  it('applies the Platform reach rate at baseline engagement', () => {
    expect(estimateImpressions({ platform: 'tiktok', followers: 50_000, engagementRate: 0.05 })).toBe(7_500)
    expect(estimateImpressions({ platform: 'instagram', followers: 50_000, engagementRate: 0.02 })).toBe(5_000)
  })

  it('lets engagement move reach between half and double', () => {
    expect(estimateImpressions({ platform: 'instagram', followers: 10_000, engagementRate: 0.03 })).toBe(1_500)
    expect(estimateImpressions({ platform: 'instagram', followers: 10_000, engagementRate: 0.5 })).toBe(2_000)
    expect(estimateImpressions({ platform: 'tiktok', followers: 1_000, engagementRate: 0 })).toBe(75)
  })

  it('never estimates fewer than one impression', () => {
    expect(estimateImpressions({ platform: 'tiktok', followers: 0, engagementRate: 0 })).toBe(1)
  })
})

describe('effectiveCpmCents', () => {
  it('prices the Fee per thousand Estimated Impressions, in whole cents', () => {
    expect(effectiveCpmCents(cents(7_500), 7_500)).toBe(1_000)
    expect(effectiveCpmCents(cents(1_000), 3)).toBe(333_333)
  })
})

describe('feeQuote', () => {
  it('suggests the Parity Fee and allows up to three times it', () => {
    expect(feeQuote({ platform: 'tiktok', followers: 50_000, engagementRate: 0.05 }, terms())).toEqual({
      estimatedImpressions: 7_500,
      suggestedFeeCents: 7_500,
      minFeeCents: 1_000,
      maxFeeCents: 22_500,
    })
  })

  it('lifts a tiny account to the flat floor so its range is never empty', () => {
    expect(feeQuote({ platform: 'tiktok', followers: 0, engagementRate: 0 }, terms())).toEqual({
      estimatedImpressions: 1,
      suggestedFeeCents: 1_000,
      minFeeCents: 1_000,
      maxFeeCents: 1_000,
    })
  })

  it('caps the range and the suggestion at the Budget', () => {
    const big = { platform: 'tiktok', followers: 1_000_000, engagementRate: 0.1 } as const
    expect(feeQuote(big, terms({ budgetCents: cents(500_000) }))).toMatchObject({ suggestedFeeCents: 300_000, maxFeeCents: 500_000 })
    expect(feeQuote(big, terms({ budgetCents: cents(200_000) }))).toMatchObject({ suggestedFeeCents: 200_000, maxFeeCents: 200_000 })
  })
})

describe('feeRange', () => {
  it('is derived from Estimated Impressions and the Campaign terms alone', () => {
    expect(feeRange(7_500, terms())).toEqual({ minCents: 1_000, maxCents: 22_500 })
  })
})
