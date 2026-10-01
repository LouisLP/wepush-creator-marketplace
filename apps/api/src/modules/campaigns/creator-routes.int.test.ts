import type { FastifyInstance } from 'fastify'
import { CREATOR_ID_HEADER } from '@wepush/contracts'
import { createTestContext, insertAdvertiser, insertBid, insertCampaign, insertCreator } from '@wepush/db/testing'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.ts'

const ctx = createTestContext()
let app: FastifyInstance
let creatorId: string

// tiktok · food · 50k followers · 5% ER → 7,500 Estimated Impressions
beforeEach(async () => {
  await ctx.reset()
  ctx.clock.set(new Date('2026-01-01T12:00:00Z'))
  app = await buildApp(ctx)
  creatorId = (await insertCreator(ctx.db, { platform: 'tiktok', category: 'food', followers: 50_000, engagementRate: 0.05 })).id
})
afterEach(() => app.close())
afterAll(() => ctx.close())

const get = (url: string, as = creatorId) => app.inject({ method: 'GET', url, headers: { [CREATOR_ID_HEADER]: as } })
const matchedTitles = async () => (await get('/api/creator/campaigns/matched')).json().items.map((c: { title: string }) => c.title)

describe('creator matched campaigns', () => {
  it('lists Matched Campaigns best Relevance first, with factors and the Suggested Fee', async () => {
    const advertiser = await insertAdvertiser(ctx.db, { name: 'Glow Cosmetics' })
    const low = await insertCampaign(ctx.db, { title: 'Low CPM', advertiserId: advertiser.id, targetCpmCents: 300 })
    await insertCampaign(ctx.db, { title: 'High CPM', advertiserId: advertiser.id, targetCpmCents: 1_500 })

    const res = await get('/api/creator/campaigns/matched')

    expect(res.statusCode).toBe(200)
    const items = res.json().items
    expect(items.map((c: { title: string }) => c.title)).toEqual(['High CPM', 'Low CPM'])
    expect(items[1]).toEqual({
      id: low.id,
      title: 'Low CPM',
      advertiserName: 'Glow Cosmetics',
      platform: 'tiktok',
      budgetCents: 100_000,
      targetCpmCents: 300,
      biddingDeadline: '2026-01-02T00:00:00.000Z',
      relevance: {
        value: 40,
        factors: [
          { key: 'payout', value: 0, weight: 0.6, contribution: 0 },
          { key: 'budget_fit', value: 1, weight: 0.4, contribution: 40 },
        ],
      },
      suggestedFeeCents: 2_250,
    })
  })

  it('breaks Relevance ties by the earlier Bidding Deadline', async () => {
    await insertCampaign(ctx.db, { title: 'Later', biddingDeadline: new Date('2026-01-03T00:00:00Z') })
    await insertCampaign(ctx.db, { title: 'Sooner', biddingDeadline: new Date('2026-01-02T00:00:00Z') })

    expect(await matchedTitles()).toEqual(['Sooner', 'Later'])
  })

  it('excludes Campaigns the creator has already bid on', async () => {
    const bidOn = await insertCampaign(ctx.db, { title: 'Bid on' })
    await insertCampaign(ctx.db, { title: 'Fresh' })
    await insertBid(ctx.db, { campaignId: bidOn.id, creatorId })
    await insertBid(ctx.db, { campaignId: (await insertCampaign(ctx.db, { title: 'Someone else bid' })).id })

    expect(await matchedTitles()).toEqual(expect.arrayContaining(['Fresh', 'Someone else bid']))
    expect(await matchedTitles()).not.toContain('Bid on')
  })

  it('excludes Campaigns at or past their Bidding Deadline, and Closed ones', async () => {
    await insertCampaign(ctx.db, { title: 'Past', biddingDeadline: new Date('2026-01-01T11:00:00Z') })
    await insertCampaign(ctx.db, { title: 'Exactly now', biddingDeadline: new Date('2026-01-01T12:00:00Z') })
    await insertCampaign(ctx.db, { title: 'Closed', status: 'closed', closedAt: new Date('2026-01-01T00:00:00Z'), spentCents: 0 })
    await insertCampaign(ctx.db, { title: 'Open' })

    expect(await matchedTitles()).toEqual(['Open'])
  })

  it('excludes Campaigns whose Requirements the profile misses', async () => {
    await insertCampaign(ctx.db, { title: 'Wrong platform', platform: 'instagram' })
    await insertCampaign(ctx.db, { title: 'Wrong category', categories: ['tech', 'gaming'] })
    await insertCampaign(ctx.db, { title: 'Too few followers', minFollowers: 50_001 })
    await insertCampaign(ctx.db, { title: 'Too little engagement', minEngagementRate: 0.051 })
    await insertCampaign(ctx.db, { title: 'Exactly meets', categories: ['tech', 'food'], minFollowers: 50_000, minEngagementRate: 0.05 })

    expect(await matchedTitles()).toEqual(['Exactly meets'])
  })
})

describe('creator campaign review', () => {
  it('returns full terms, every Requirement checked, Relevance and the Fee Quote', async () => {
    const advertiser = await insertAdvertiser(ctx.db, { name: 'Glow Cosmetics' })
    const campaign = await insertCampaign(ctx.db, {
      advertiserId: advertiser.id,
      title: 'Snack launch',
      brief: 'Show the snack.',
      categories: ['food', 'lifestyle'],
      minFollowers: 10_000,
      minEngagementRate: 0.03,
      targetCpmCents: 300,
    })

    const res = await get(`/api/creator/campaigns/${campaign.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      id: campaign.id,
      title: 'Snack launch',
      advertiserName: 'Glow Cosmetics',
      brief: 'Show the snack.',
      status: 'open',
      requirements: { platform: 'tiktok', categories: ['food', 'lifestyle'], minFollowers: 10_000, minEngagementRate: 0.03 },
      budgetCents: 100_000,
      targetCpmCents: 300,
      biddingDeadline: '2026-01-02T00:00:00.000Z',
      requirementChecks: [
        { requirement: 'platform', passed: true, actual: 'tiktok', required: 'tiktok' },
        { requirement: 'category', passed: true, actual: 'food', required: ['food', 'lifestyle'] },
        { requirement: 'minFollowers', passed: true, actual: 50_000, required: 10_000 },
        { requirement: 'minEngagement', passed: true, actual: 0.05, required: 0.03 },
      ],
      relevance: { value: 40, factors: expect.any(Array) },
      feeQuote: { estimatedImpressions: 7_500, suggestedFeeCents: 2_250, minFeeCents: 1_000, maxFeeCents: 6_750 },
      hasBid: false,
    })
  })

  it('404s a Campaign whose Requirements the profile misses', async () => {
    const campaign = await insertCampaign(ctx.db, { minFollowers: 1_000_000 })

    const res = await get(`/api/creator/campaigns/${campaign.id}`)

    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ code: 'not_found' })
  })

  it('404s a Campaign past its Bidding Deadline the creator never bid on', async () => {
    const campaign = await insertCampaign(ctx.db, { biddingDeadline: new Date('2026-01-01T00:00:00Z') })

    expect((await get(`/api/creator/campaigns/${campaign.id}`)).statusCode).toBe(404)
  })

  it('stays visible once bid on, even when no longer Matched, showing the misses', async () => {
    const campaign = await insertCampaign(ctx.db, {
      minFollowers: 60_000,
      status: 'closed',
      closedAt: new Date('2026-01-01T00:00:00Z'),
      spentCents: 0,
    })
    await insertBid(ctx.db, { campaignId: campaign.id, creatorId })

    const res = await get(`/api/creator/campaigns/${campaign.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'closed', hasBid: true })
    expect(res.json().requirementChecks).toContainEqual({ requirement: 'minFollowers', passed: false, actual: 50_000, required: 60_000 })
  })

  it('404s another creator\'s Bid-only Campaign', async () => {
    const campaign = await insertCampaign(ctx.db, { platform: 'instagram' })
    await insertBid(ctx.db, { campaignId: campaign.id })

    expect((await get(`/api/creator/campaigns/${campaign.id}`)).statusCode).toBe(404)
  })

  it('404s an unknown id and 400s a malformed one', async () => {
    expect((await get('/api/creator/campaigns/01900000-0000-7000-8000-000000000999')).json()).toMatchObject({ code: 'not_found' })
    expect((await get('/api/creator/campaigns/nope')).json()).toMatchObject({ code: 'validation_failed' })
  })
})
