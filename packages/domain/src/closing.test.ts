import type { BidId, BidSnapshot, CampaignId, CampaignTerms, CreatorId, PendingBid } from './types.ts'
import { describe, expect, it } from 'vitest'
import { closeCampaign, scoreBid, SCORING_VERSION, summarizeWinners } from './closing.ts'
import { cents } from './types.ts'

// Fee Range on 10,000 impressions: [$10, $200] (3× Parity Fee $100 capped at the Budget)
const campaign: CampaignTerms = {
  id: 'c1' as CampaignId,
  requirements: { platform: 'tiktok', categories: ['food'], minFollowers: 1_000, minEngagementRate: null },
  budgetCents: cents(20_000),
  targetCpmCents: cents(1_000),
  biddingDeadline: new Date('2026-01-01T00:00:00Z'),
}

interface BidSpec {
  fee: number
  impressions: number
  cpm: number
  er?: number
  followers?: number
  placedAt?: string
}

function bid(id: string, { fee, impressions, cpm, er = 0.05, followers = 50_000, placedAt = '2025-12-01T00:00:00Z' }: BidSpec): PendingBid {
  const snapshot: BidSnapshot = { followers, engagementRate: er, estimatedImpressions: impressions, effectiveCpmCents: cents(cpm) }
  return { id: id as BidId, creatorId: `creator-${id}` as CreatorId, feeCents: cents(fee), snapshot, placedAt: new Date(placedAt) }
}

describe('scoreBid', () => {
  it('scores 50 on Target CPM at baseline engagement', () => {
    expect(scoreBid(campaign, bid('a', { fee: 10_000, impressions: 10_000, cpm: 1_000 })).score).toBe(50)
  })

  it('weighs CPM fit three times engagement, each capped at double', () => {
    const { score, factors } = scoreBid(campaign, bid('a', { fee: 8_000, impressions: 10_000, cpm: 800, er: 0.5 }))
    expect(score).toBe(71.88)
    expect(factors).toEqual([
      { key: 'cpm_fit', value: 0.625, weight: 0.75, contribution: 46.875 },
      { key: 'engagement', value: 1, weight: 0.25, contribution: 25 },
    ])
  })

  it('scores 100 at half the Target CPM and double baseline engagement', () => {
    expect(scoreBid(campaign, bid('a', { fee: 5_000, impressions: 10_000, cpm: 500, er: 0.1 })).score).toBe(100)
  })
})

describe('closeCampaign', () => {
  it('walks Eligible Bids by Score, skipping any that do not fit the Remaining Budget', () => {
    const outcome = closeCampaign(campaign, [
      bid('a', { fee: 8_000, impressions: 10_000, cpm: 800 }), //       59.38
      bid('b', { fee: 10_000, impressions: 10_000, cpm: 1_000 }), //    50
      bid('c', { fee: 5_000, impressions: 10_000, cpm: 500 }), //       87.5
      bid('d', { fee: 10_000, impressions: 10_000, cpm: 1_000, er: 0.1 }), // 62.5
      bid('e', { fee: 4_000, impressions: 2_000, cpm: 2_000, er: 0.025 }), // 25
    ])

    expect(outcome.scoringVersion).toBe(SCORING_VERSION)
    expect(outcome.spentCents).toBe(19_000)
    expect(outcome.outcomes.map(o => [o.bidId, o.rank, o.score, o.status, o.lossReason, o.remainingBudgetCents])).toEqual([
      ['c', 1, 87.5, 'won', null, 20_000],
      ['d', 2, 62.5, 'won', null, 15_000],
      ['a', 3, 59.38, 'lost', 'over_budget', 5_000],
      ['b', 4, 50, 'lost', 'over_budget', 5_000],
      ['e', 5, 25, 'won', null, 5_000],
    ])
  })

  it('ranks ineligible Bids last with the first Loss Reason that applies', () => {
    const outcome = closeCampaign(campaign, [
      bid('fee', { fee: 25_000, impressions: 10_000, cpm: 2_500 }),
      bid('both', { fee: 25_000, impressions: 10_000, cpm: 2_500, followers: 999, placedAt: '2025-12-02T00:00:00Z' }),
      bid('reqs', { fee: 5_000, impressions: 10_000, cpm: 500, followers: 999 }),
      bid('ok', { fee: 10_000, impressions: 10_000, cpm: 1_000 }),
    ])

    expect(outcome.spentCents).toBe(10_000)
    expect(outcome.outcomes.map(o => [o.bidId, o.rank, o.status, o.lossReason, o.remainingBudgetCents])).toEqual([
      ['ok', 1, 'won', null, 20_000],
      ['reqs', 2, 'lost', 'requirements_not_met', null],
      ['fee', 3, 'lost', 'fee_out_of_range', null],
      ['both', 4, 'lost', 'requirements_not_met', null],
    ])
  })

  it('re-checks the minimum engagement rate on the Bid Snapshot', () => {
    const strict = { ...campaign, requirements: { ...campaign.requirements, minEngagementRate: 0.05 } }
    const outcome = closeCampaign(strict, [bid('low', { fee: 10_000, impressions: 10_000, cpm: 1_000, er: 0.049 })])
    expect(outcome.outcomes[0]).toMatchObject({ status: 'lost', lossReason: 'requirements_not_met' })
  })

  it('breaks Score ties by lower Fee, then earlier placement, then id', () => {
    const outcome = closeCampaign(campaign, [
      bid('late', { fee: 5_000, impressions: 5_000, cpm: 1_000, placedAt: '2025-12-02T00:00:00Z' }),
      bid('y', { fee: 5_000, impressions: 5_000, cpm: 1_000 }),
      bid('x', { fee: 5_000, impressions: 5_000, cpm: 1_000 }),
      bid('cheap', { fee: 4_000, impressions: 4_000, cpm: 1_000, placedAt: '2025-12-03T00:00:00Z' }),
    ])
    expect(outcome.outcomes.map(o => o.bidId)).toEqual(['cheap', 'x', 'y', 'late'])
  })

  it('closes with no winners when there are no bids', () => {
    expect(closeCampaign(campaign, [])).toEqual({ scoringVersion: SCORING_VERSION, spentCents: 0, outcomes: [] })
  })
})

describe('summarizeWinners', () => {
  it('totals Fees and Estimated Impressions into a blended CPM', () => {
    expect(summarizeWinners([
      bid('a', { fee: 5_000, impressions: 10_000, cpm: 500 }),
      bid('b', { fee: 10_000, impressions: 5_000, cpm: 2_000 }),
    ])).toEqual({ spentCents: 15_000, winners: 2, estimatedImpressions: 15_000, blendedCpmCents: 1_000 })
  })

  it('has no blended CPM without Winners', () => {
    expect(summarizeWinners([])).toEqual({ spentCents: 0, winners: 0, estimatedImpressions: 0, blendedCpmCents: null })
  })
})
