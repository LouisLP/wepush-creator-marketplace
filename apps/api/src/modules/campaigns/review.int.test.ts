import type { FastifyInstance } from 'fastify'
import { ADVERTISER_ID_HEADER } from '@wepush/contracts'
import { createTestContext, insertAdvertiser, insertBid, insertCampaign, insertCreator } from '@wepush/db/testing'
import { SCORING_VERSION } from '@wepush/domain'
import { closeNextDue } from '@wepush/worker/close-campaigns'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.ts'

const ctx = createTestContext()
let app: FastifyInstance
let advertiserId: string

const DEADLINE = new Date('2026-01-02T00:00:00Z')

beforeEach(async () => {
  await ctx.reset()
  ctx.clock.set(new Date('2026-01-01T12:00:00Z'))
  app = await buildApp(ctx)
  advertiserId = (await insertAdvertiser(ctx.db, { name: 'Glow Cosmetics' })).id
})
afterEach(() => app.close())
afterAll(() => ctx.close())

function get(id: string, as = advertiserId) {
  return app.inject({ method: 'GET', url: `/api/advertiser/campaigns/${id}`, headers: { [ADVERTISER_ID_HEADER]: as } })
}

async function bidBy(campaignId: string, handle: string, bid: { fee: number, impressions: number, followers?: number }) {
  const creator = await insertCreator(ctx.db, { handle })
  return insertBid(ctx.db, {
    campaignId,
    creatorId: creator.id,
    feeCents: bid.fee,
    followers: bid.followers ?? 50_000,
    estimatedImpressions: bid.impressions,
    effectiveCpmCents: Math.round(bid.fee * 1000 / bid.impressions),
  })
}

// Budget $150, Target CPM $10: @cheap and @mid fit ($130), @pricey is over budget, @tiny misses minFollowers.
async function contestedCampaign() {
  const campaign = await insertCampaign(ctx.db, { advertiserId, title: 'Snack launch', budgetCents: 15_000, targetCpmCents: 1_000, biddingDeadline: DEADLINE })
  await bidBy(campaign.id, '@pricey', { fee: 10_000, impressions: 10_000 })
  await bidBy(campaign.id, '@cheap', { fee: 5_000, impressions: 10_000 })
  await bidBy(campaign.id, '@tiny', { fee: 5_000, impressions: 10_000, followers: 500 })
  await bidBy(campaign.id, '@mid', { fee: 8_000, impressions: 10_000 })
  return campaign
}

function standings(body: { bids: { handle: string, rank: number, status: string, lossReason: string | null, remainingBudgetCents: number | null }[] }) {
  return body.bids.map(b => [b.rank, b.handle, b.status, b.lossReason, b.remainingBudgetCents])
}

describe('advertiser campaign review', () => {
  it('shows a provisional "if it closed now" outcome while Open', async () => {
    const campaign = await contestedCampaign()

    const res = await get(campaign.id)

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toMatchObject({
      id: campaign.id,
      title: 'Snack launch',
      status: 'open',
      budgetCents: 15_000,
      targetCpmCents: 1_000,
      biddingDeadline: DEADLINE.toISOString(),
      closedAt: null,
      provisional: true,
      scoringVersion: SCORING_VERSION,
      outcome: { spentCents: 13_000, winnerCount: 2, estimatedImpressions: 20_000, blendedCpmCents: 650 },
    })
    expect(standings(body)).toEqual([
      [1, '@cheap', 'won', null, 15_000],
      [2, '@mid', 'won', null, 10_000],
      [3, '@pricey', 'lost', 'over_budget', 2_000],
      [4, '@tiny', 'lost', 'requirements_not_met', null],
    ])
    expect(body.bids[0]).toEqual({
      id: expect.any(String),
      handle: '@cheap',
      category: 'food',
      feeCents: 5_000,
      placedAt: '2026-01-01T00:00:00.000Z',
      snapshot: { followers: 50_000, engagementRate: 0.05, estimatedImpressions: 10_000, effectiveCpmCents: 500 },
      rank: 1,
      score: expect.any(Number),
      factors: [
        { key: 'cpm_fit', value: 1, weight: 0.75, contribution: 75 },
        { key: 'engagement', value: expect.any(Number), weight: 0.25, contribution: expect.any(Number) },
      ],
      status: 'won',
      lossReason: null,
      remainingBudgetCents: 15_000,
    })
  })

  it('provisional Ranks and Winners match what the worker then records', async () => {
    const campaign = await contestedCampaign()
    ctx.clock.set(new Date(DEADLINE.getTime() + 1_000))
    const provisional = (await get(campaign.id)).json()
    expect(provisional).toMatchObject({ status: 'open', provisional: true })

    expect(await closeNextDue(ctx, new Set())).toMatchObject({ kind: 'closed', campaignId: campaign.id })
    const closed = (await get(campaign.id)).json()

    expect(closed).toMatchObject({ status: 'closed', provisional: false, closedAt: expect.any(String), scoringVersion: SCORING_VERSION })
    expect(closed.bids).toEqual(provisional.bids)
    expect(closed.outcome).toEqual(provisional.outcome)
    expect(closed.outcome.spentCents).toBeLessThanOrEqual(closed.budgetCents)
    for (const loser of closed.bids.filter((b: { status: string }) => b.status === 'lost'))
      expect(loser.lossReason).not.toBeNull()
  })

  it('reports an empty outcome with no Bids', async () => {
    const campaign = await insertCampaign(ctx.db, { advertiserId })

    expect((await get(campaign.id)).json()).toMatchObject({
      bids: [],
      outcome: { spentCents: 0, winnerCount: 0, estimatedImpressions: 0, blendedCpmCents: null },
    })
  })

  it('404s another Advertiser\'s Campaign and unknown ids', async () => {
    const theirs = await insertCampaign(ctx.db)

    expect((await get(theirs.id)).json()).toMatchObject({ code: 'not_found' })
    expect((await get('01900000-0000-7000-8000-000000000999')).statusCode).toBe(404)
  })
})
