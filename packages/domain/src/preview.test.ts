import type { ProposedTerms } from './preview.ts'
import type { CreatorProfile } from './types.ts'
import { describe, expect, it } from 'vitest'
import { previewCampaign } from './preview.ts'
import { cents } from './types.ts'

const tiktokFood = (followers: number): CreatorProfile => ({ platform: 'tiktok', category: 'food', followers, engagementRate: 0.05 })

function terms(overrides: Partial<ProposedTerms> = {}): ProposedTerms {
  return {
    requirements: { platform: 'tiktok', categories: ['food'], minFollowers: 1_000, minEngagementRate: null },
    budgetCents: cents(100_000),
    targetCpmCents: cents(1_000),
    ...overrides,
  }
}

const outsiders: CreatorProfile[] = [
  { platform: 'instagram', category: 'food', followers: 50_000, engagementRate: 0.05 },
  { platform: 'tiktok', category: 'tech', followers: 50_000, engagementRate: 0.05 },
  tiktokFood(500),
]

describe('previewCampaign', () => {
  it('counts only Creators meeting every Requirement and spreads their Suggested Fees', () => {
    const preview = previewCampaign([...outsiders, tiktokFood(100_000), tiktokFood(20_000), tiktokFood(50_000)], terms())

    expect(preview).toEqual({
      matchingCreators: 3,
      suggestedFees: { minCents: 3_000, medianCents: 7_500, maxCents: 15_000 },
      postsAtMedian: 13,
      cpmRangeCents: { low: 300, high: 1_500 },
    })
  })

  it('averages the middle pair for an even count, with the Fee floor applied', () => {
    const preview = previewCampaign([tiktokFood(2_000), tiktokFood(20_000), tiktokFood(50_000), tiktokFood(100_000)], terms())

    expect(preview.suggestedFees).toEqual({ minCents: 1_000, medianCents: 5_250, maxCents: 15_000 })
    expect(preview.postsAtMedian).toBe(19)
  })

  it('caps Suggested Fees at the Budget', () => {
    const preview = previewCampaign([tiktokFood(100_000)], terms({ budgetCents: cents(5_000) }))

    expect(preview.suggestedFees).toEqual({ minCents: 5_000, medianCents: 5_000, maxCents: 5_000 })
    expect(preview.postsAtMedian).toBe(1)
  })

  it('reports no fees when nobody matches, keeping the Platform CPM Range', () => {
    const preview = previewCampaign(outsiders, terms({ requirements: { ...terms().requirements, platform: 'instagram', minEngagementRate: 0.5 } }))

    expect(preview).toEqual({ matchingCreators: 0, suggestedFees: null, postsAtMedian: null, cpmRangeCents: { low: 500, high: 2_000 } })
  })
})
