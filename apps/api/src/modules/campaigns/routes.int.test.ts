import type { FastifyInstance } from 'fastify'
import { ADVERTISER_ID_HEADER, CREATOR_ID_HEADER } from '@wepush/contracts'
import { createTestContext, insertAdvertiser, insertBid, insertCampaign, insertCreator } from '@wepush/db/testing'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.ts'

const ctx = createTestContext()
let app: FastifyInstance
let headers: Record<string, string>

const HOUR = 3_600_000
const hoursFromNow = (h: number) => new Date(ctx.clock.now().getTime() + h * HOUR).toISOString()

const terms = {
  platform: 'tiktok',
  categories: ['food', 'lifestyle'],
  minFollowers: 10_000,
  minEngagementRate: null,
  budgetCents: 100_000,
  targetCpmCents: 1_000,
}
const body = () => ({ ...terms, title: 'Taco Tuesday', brief: 'Film our new taco.', biddingDeadline: hoursFromNow(72) })

const post = (url: string, payload: object) => app.inject({ method: 'POST', url, headers, payload })

beforeEach(async () => {
  await ctx.reset()
  app = await buildApp(ctx)
  headers = { [ADVERTISER_ID_HEADER]: (await insertAdvertiser(ctx.db)).id }
})
afterEach(() => app.close())
afterAll(() => ctx.close())

describe('create campaign', () => {
  it('creates an Open Campaign owned by the acting Advertiser', async () => {
    const res = await post('/api/advertiser/campaigns', body())

    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({
      title: 'Taco Tuesday',
      platform: 'tiktok',
      status: 'open',
      budgetCents: 100_000,
      biddingDeadline: hoursFromNow(72),
      bidCount: 0,
      spentCents: null,
    })
    const stored = await ctx.repos.campaigns.getById(res.json().id)
    expect(stored).toMatchObject({
      advertiserId: headers[ADVERTISER_ID_HEADER],
      brief: 'Film our new taco.',
      terms: { requirements: { categories: ['food', 'lifestyle'], minFollowers: 10_000, minEngagementRate: null }, targetCpmCents: 1_000 },
    })
  })

  it('rejects out-of-bounds fields with per-field errors', async () => {
    const res = await post('/api/advertiser/campaigns', {
      ...body(),
      title: ' ',
      categories: [],
      budgetCents: 999,
      targetCpmCents: 10_001,
      minEngagementRate: 1.5,
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().code).toBe('validation_failed')
    expect(res.json().errors.map((e: { path: string }) => e.path).sort())
      .toEqual(['budgetCents', 'categories', 'minEngagementRate', 'targetCpmCents', 'title'])
  })

  it('rejects a Bidding Deadline in the past', async () => {
    const res = await post('/api/advertiser/campaigns', { ...body(), biddingDeadline: hoursFromNow(-1) })

    expect(res.statusCode).toBe(422)
    expect(res.json()).toMatchObject({ code: 'deadline_in_past' })
  })

  it('rejects a Bidding Deadline outside the bidding window with the allowed range', async () => {
    for (const hours of [0.05, 24 * 31]) {
      const res = await post('/api/advertiser/campaigns', { ...body(), biddingDeadline: hoursFromNow(hours) })

      expect(res.statusCode).toBe(422)
      expect(res.json()).toMatchObject({ code: 'deadline_out_of_range', earliest: hoursFromNow(5 / 60), latest: hoursFromNow(24 * 30) })
    }
  })

  it('shows the new Campaign in Matched for qualifying Creators only', async () => {
    const qualifying = await insertCreator(ctx.db, { platform: 'tiktok', category: 'food', followers: 50_000 })
    const tooSmall = await insertCreator(ctx.db, { platform: 'tiktok', category: 'food', followers: 5_000 })
    const created = (await post('/api/advertiser/campaigns', body())).json()

    const matchedIds = async (creatorId: string) =>
      (await app.inject({ method: 'GET', url: '/api/creator/campaigns/matched', headers: { [CREATOR_ID_HEADER]: creatorId } }))
        .json()
        .items
        .map((c: { id: string }) => c.id)

    expect(await matchedIds(qualifying.id)).toEqual([created.id])
    expect(await matchedIds(tooSmall.id)).toEqual([])
  })

  it('makes the new Campaign appear in the Advertiser\'s list', async () => {
    const created = (await post('/api/advertiser/campaigns', body())).json()

    const res = await app.inject({ method: 'GET', url: '/api/advertiser/campaigns', headers })

    expect(res.json().items).toEqual([created])
  })
})

describe('advertiser campaign list', () => {
  it('reports the Bid count and Spent of each Campaign', async () => {
    const advertiserId = headers[ADVERTISER_ID_HEADER]!
    const open = await insertCampaign(ctx.db, { advertiserId, title: 'Open' })
    await insertBid(ctx.db, { campaignId: open.id })
    await insertBid(ctx.db, { campaignId: open.id })
    await insertCampaign(ctx.db, {
      advertiserId,
      title: 'Closed',
      status: 'closed',
      closedAt: new Date('2026-01-02T00:00:00Z'),
      spentCents: 40_000,
      scoringVersion: 'v1',
    })

    const res = await app.inject({ method: 'GET', url: '/api/advertiser/campaigns', headers })

    const byTitle = Object.fromEntries(res.json().items.map((c: { title: string }) => [c.title, c]))
    expect(byTitle.Open).toMatchObject({ bidCount: 2, spentCents: null })
    expect(byTitle.Closed).toMatchObject({ bidCount: 0, spentCents: 40_000 })
  })
})

describe('campaign preview', () => {
  it('counts matching Creators and spreads their Suggested Fees', async () => {
    for (const followers of [20_000, 50_000, 100_000])
      await insertCreator(ctx.db, { platform: 'tiktok', category: 'food', followers, engagementRate: 0.05 })
    await insertCreator(ctx.db, { platform: 'tiktok', category: 'tech', followers: 50_000 })
    await insertCreator(ctx.db, { platform: 'instagram', category: 'food', followers: 50_000 })
    await insertCreator(ctx.db, { platform: 'tiktok', category: 'food', followers: 5_000 })

    const res = await post('/api/advertiser/campaigns/preview', terms)

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      matchingCreators: 3,
      suggestedFees: { minCents: 3_000, medianCents: 7_500, maxCents: 15_000 },
      postsAtMedian: 13,
      cpmRangeCents: { low: 300, high: 1_500 },
    })
  })

  it('reports no matches with the Platform CPM Range still shown', async () => {
    await insertCreator(ctx.db, { platform: 'tiktok', category: 'food', followers: 50_000 })

    const res = await post('/api/advertiser/campaigns/preview', { ...terms, platform: 'instagram' })

    expect(res.json()).toEqual({ matchingCreators: 0, suggestedFees: null, postsAtMedian: null, cpmRangeCents: { low: 500, high: 2_000 } })
  })

  it('validates the same bounds as create', async () => {
    const res = await post('/api/advertiser/campaigns/preview', { ...terms, budgetCents: 0 })

    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ code: 'validation_failed', errors: [{ path: 'budgetCents' }] })
  })
})
