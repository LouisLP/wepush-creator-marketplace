import type { FastifyInstance } from 'fastify'
import { CREATOR_ID_HEADER } from '@wepush/contracts'
import { createTestContext, insertBid, insertCampaign, insertCreator, listBids } from '@wepush/db/testing'
import { closeCampaign, SCORING_VERSION } from '@wepush/domain'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.ts'

const ctx = createTestContext()
let app: FastifyInstance
let creatorId: string

const food50k = { platform: 'tiktok', category: 'food', followers: 50_000, engagementRate: 0.05 } as const

// tiktok · food · 50k followers · 5% ER → 7,500 Estimated Impressions; at the default
// $10 Target CPM: Parity/Suggested Fee $75, Fee Range $10–$225
beforeEach(async () => {
  await ctx.reset()
  ctx.clock.set(new Date('2026-01-01T12:00:00Z'))
  app = await buildApp(ctx)
  creatorId = (await insertCreator(ctx.db, food50k)).id
})
afterEach(() => app.close())
afterAll(() => ctx.close())

const get = (url: string, as = creatorId) => app.inject({ method: 'GET', url, headers: { [CREATOR_ID_HEADER]: as } })
function bid(campaignId: string, feeCents: unknown, as = creatorId) {
  return app.inject({
    method: 'POST',
    url: `/api/creator/campaigns/${campaignId}/bids`,
    headers: { [CREATOR_ID_HEADER]: as },
    payload: { feeCents },
  })
}

/** What the worker does for one due Campaign. */
async function closeDue() {
  await ctx.uow.run(async (repos) => {
    const campaign = (await repos.campaigns.claimNextDue(ctx.clock.now()))!
    const outcome = closeCampaign(campaign.terms, await repos.bids.listPending(campaign.id))
    await repos.bids.recordOutcomes(outcome.outcomes)
    await repos.campaigns.markClosed({ id: campaign.id, spentCents: outcome.spentCents, closedAt: ctx.clock.now(), scoringVersion: outcome.scoringVersion })
  })
}

describe('placing a Bid', () => {
  it('writes the Bid Snapshot and returns the Pending Bid', async () => {
    const campaign = await insertCampaign(ctx.db)

    const res = await bid(campaign.id, 6_000)

    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({
      id: expect.any(String),
      feeCents: 6_000,
      status: 'pending',
      placedAt: '2026-01-01T12:00:00.000Z',
      snapshot: { followers: 50_000, engagementRate: 0.05, estimatedImpressions: 7_500, effectiveCpmCents: 800 },
      outcome: null,
    })
    expect(await listBids(ctx.db)).toEqual([expect.objectContaining({ campaignId: campaign.id, creatorId, feeCents: 6_000, estimatedImpressions: 7_500 })])
  })

  it('moves the Campaign from Matched to My Bids, and the review shows the Pending Bid', async () => {
    const campaign = await insertCampaign(ctx.db, { title: 'Snack launch' })
    await bid(campaign.id, 7_500)

    expect((await get('/api/creator/campaigns/matched')).json().items).toEqual([])
    expect((await get('/api/creator/bids')).json().items).toEqual([{
      id: expect.any(String),
      campaignId: campaign.id,
      campaignTitle: 'Snack launch',
      feeCents: 7_500,
      status: 'pending',
      rank: null,
      biddingDeadline: '2026-01-02T00:00:00.000Z',
    }])
    expect((await get(`/api/creator/campaigns/${campaign.id}`)).json().bid).toMatchObject({
      feeCents: 7_500,
      status: 'pending',
      snapshot: { effectiveCpmCents: 1_000 },
      outcome: null,
    })
  })

  it('accepts Fees exactly at either end of the Fee Range', async () => {
    const other = (await insertCreator(ctx.db, food50k)).id
    const campaign = await insertCampaign(ctx.db)

    expect((await bid(campaign.id, 1_000)).statusCode).toBe(201)
    expect((await bid(campaign.id, 22_500, other)).statusCode).toBe(201)
  })

  it('rejects a Fee outside the Fee Range, naming the range', async () => {
    const campaign = await insertCampaign(ctx.db)

    for (const fee of [999, 22_501]) {
      const res = await bid(campaign.id, fee)
      expect(res.statusCode).toBe(422)
      expect(res.json()).toMatchObject({ code: 'fee_out_of_range', minCents: 1_000, maxCents: 22_500, detail: 'Fee must be between $10.00 and $225.00' })
    }
    expect(await listBids(ctx.db)).toEqual([])
  })

  it('rejects a second Bid on the same Campaign', async () => {
    const campaign = await insertCampaign(ctx.db)
    await bid(campaign.id, 7_500)

    const res = await bid(campaign.id, 5_000)

    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ code: 'already_bid' })
  })

  it('places exactly one of two concurrent Bids by the same Creator', async () => {
    const campaign = await insertCampaign(ctx.db)

    const results = await Promise.all([bid(campaign.id, 7_500), bid(campaign.id, 5_000)])

    expect(results.map(r => r.statusCode).sort()).toEqual([201, 409])
    expect(results.find(r => r.statusCode === 409)!.json()).toMatchObject({ code: 'already_bid' })
    expect(await listBids(ctx.db)).toHaveLength(1)
  })

  it('rejects a Bid at or after the Bidding Deadline', async () => {
    const campaign = await insertCampaign(ctx.db, { biddingDeadline: new Date('2026-01-01T12:00:00Z') })

    const res = await bid(campaign.id, 7_500)

    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ code: 'deadline_passed' })
  })

  it('rejects a Bid on a Closed Campaign', async () => {
    const campaign = await insertCampaign(ctx.db, { status: 'closed', closedAt: new Date('2026-01-01T00:00:00Z'), spentCents: 0 })

    const res = await bid(campaign.id, 7_500)

    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ code: 'campaign_closed' })
  })

  it('rejects a Creator who misses the Requirements, with the checks', async () => {
    const campaign = await insertCampaign(ctx.db, { minFollowers: 60_000 })

    const res = await bid(campaign.id, 7_500)

    expect(res.statusCode).toBe(422)
    expect(res.json().code).toBe('requirements_not_met')
    expect(res.json().checks).toContainEqual({ requirement: 'minFollowers', passed: false, actual: 50_000, required: 60_000 })
  })

  it('400s a non-positive or fractional Fee on the feeCents field', async () => {
    const campaign = await insertCampaign(ctx.db)

    for (const fee of [0, 12.5, '7500']) {
      const res = await bid(campaign.id, fee)
      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'validation_failed', errors: [expect.objectContaining({ path: 'feeCents' })] })
    }
  })

  it('404s an unknown Campaign', async () => {
    expect((await bid('01900000-0000-7000-8000-000000000999', 7_500)).json()).toMatchObject({ code: 'not_found' })
  })
})

describe('bid outcome', () => {
  async function contested() {
    const rival = (await insertCreator(ctx.db, food50k)).id
    const campaign = await insertCampaign(ctx.db, { budgetCents: 10_000 })
    await bid(campaign.id, 6_000, rival)
    await bid(campaign.id, 7_500)
    ctx.clock.set(new Date('2026-01-02T00:00:00Z'))
    await closeDue()
    return { campaign, rival }
  }

  it('shows Rank, Score factors, Scoring Version, Loss Reason and Remaining Budget once Closed', async () => {
    const { campaign } = await contested()

    const res = await get(`/api/creator/campaigns/${campaign.id}`)

    expect(res.json().status).toBe('closed')
    expect(res.json().bid).toMatchObject({
      feeCents: 7_500,
      status: 'lost',
      outcome: {
        rank: 2,
        score: expect.any(Number),
        factors: [
          expect.objectContaining({ key: 'cpm_fit', value: 0.5 }),
          expect.objectContaining({ key: 'engagement' }),
        ],
        scoringVersion: SCORING_VERSION,
        lossReason: 'over_budget',
        remainingBudgetCents: 4_000,
      },
    })
    expect((await get('/api/creator/bids')).json().items).toEqual([expect.objectContaining({ status: 'lost', rank: 2 })])
  })

  it('keeps the rival\'s Bid sealed once Closed', async () => {
    const { campaign, rival } = await contested()
    const rivalBid = (await listBids(ctx.db)).find(b => b.creatorId === rival)!

    for (const res of [await get(`/api/creator/campaigns/${campaign.id}`), await get('/api/creator/bids')]) {
      expect(res.body).not.toContain(rivalBid.id)
      expect(res.body).not.toContain('6000')
      expect(res.body).not.toMatch(/"(bids|bidCount|bidsCount|winners)"/)
    }
  })

  it('shows a Won Bid with no Loss Reason', async () => {
    const { campaign, rival } = await contested()

    expect((await get(`/api/creator/campaigns/${campaign.id}`, rival)).json().bid).toMatchObject({
      status: 'won',
      outcome: { rank: 1, lossReason: null, remainingBudgetCents: 10_000 },
    })
  })
})

describe('sealed Bids', () => {
  it('never shows a Creator another Creator\'s Bid or the Bid count', async () => {
    const rival = await insertCreator(ctx.db, food50k)
    const campaign = await insertCampaign(ctx.db)
    const rivalBid = await insertBid(ctx.db, { campaignId: campaign.id, creatorId: rival.id, feeCents: 4_321 })

    const review = await get(`/api/creator/campaigns/${campaign.id}`)
    const mine = await get('/api/creator/bids')

    expect(review.json().bid).toBeNull()
    expect(mine.json().items).toEqual([])
    for (const body of [review.body, mine.body, (await get('/api/creator/campaigns/matched')).body]) {
      expect(body).not.toContain(rivalBid.id)
      expect(body).not.toContain('4321')
      expect(body).not.toMatch(/"(bids|bidCount|bidsCount)"/)
    }
  })
})
