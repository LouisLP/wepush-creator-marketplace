import type { CampaignId, CampaignTerms } from './types.ts'
import { describe, expect, it } from 'vitest'
import { byRelevance, relevance } from './relevance.ts'
import { cents } from './types.ts'

// 7,500 Estimated Impressions → Parity Fee $75 at a $10 Target CPM
const creator = { platform: 'tiktok', followers: 50_000, engagementRate: 0.05 } as const

function terms(overrides: Partial<CampaignTerms> = {}): CampaignTerms {
  return {
    id: 'c1' as CampaignId,
    requirements: { platform: 'tiktok', categories: ['food'], minFollowers: 0, minEngagementRate: null },
    budgetCents: cents(100_000),
    targetCpmCents: cents(1_000),
    biddingDeadline: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  }
}

describe('relevance', () => {
  it('weighs Target CPM within the Platform range and Budget Fit', () => {
    const r = relevance(creator, terms())
    expect(r.relevance).toBe(75)
    expect(r.parityFeeCents).toBe(7_500)
    expect(r.budgetFit).toBeCloseTo(13.333, 3)
    expect(r.factors).toEqual([
      { key: 'payout', value: expect.closeTo(0.5833, 4), weight: 0.6, contribution: expect.closeTo(35, 4) },
      { key: 'budget_fit', value: 1, weight: 0.4, contribution: 40 },
    ])
  })

  it('gives partial fit credit below five Posts', () => {
    expect(relevance(creator, terms({ budgetCents: cents(30_000) })).relevance).toBe(67)
  })

  it('gives no fit credit when the Budget cannot pay one Parity Fee', () => {
    const r = relevance(creator, terms({ budgetCents: cents(5_000) }))
    expect(r.factors[1]).toMatchObject({ key: 'budget_fit', value: 0, contribution: 0 })
    expect(r.relevance).toBe(35)
  })

  it('clamps payout to the Platform CPM range', () => {
    expect(relevance(creator, terms({ targetCpmCents: cents(5_000) })).factors[0]!.value).toBe(1)
    expect(relevance(creator, terms({ targetCpmCents: cents(200) })).factors[0]!.value).toBe(0)
  })
})

describe('byRelevance', () => {
  it('orders by Relevance, then earlier Bidding Deadline, then id', () => {
    const at = (iso: string) => new Date(iso)
    const items = [
      { relevance: 50, terms: terms({ id: 'b' as CampaignId, biddingDeadline: at('2026-01-03T00:00:00Z') }) },
      { relevance: 50, terms: terms({ id: 'c' as CampaignId, biddingDeadline: at('2026-01-02T00:00:00Z') }) },
      { relevance: 80, terms: terms({ id: 'd' as CampaignId, biddingDeadline: at('2026-01-09T00:00:00Z') }) },
      { relevance: 50, terms: terms({ id: 'a' as CampaignId, biddingDeadline: at('2026-01-03T00:00:00Z') }) },
    ]
    expect(items.sort(byRelevance).map(i => i.terms.id)).toEqual(['d', 'c', 'a', 'b'])
  })
})
