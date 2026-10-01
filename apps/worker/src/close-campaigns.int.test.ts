import type { CampaignId } from '@wepush/domain'
import { seed } from '@wepush/db/seed'
import { createTestContext, insertBid, insertCampaign, listBids, listCampaigns } from '@wepush/db/testing'
import { SCORING_VERSION } from '@wepush/domain'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { closeNextDue } from './close-campaigns.ts'

const ctx = createTestContext()
beforeEach(() => ctx.reset())
afterAll(() => ctx.close())

const noExclude = new Set<CampaignId>()

describe('closeNextDue', () => {
  it('closes a due campaign and records bid outcomes within budget', async () => {
    ctx.clock.set(new Date('2026-01-02T00:00:01Z'))
    const campaign = await insertCampaign(ctx.db, { biddingDeadline: new Date('2026-01-02T00:00:00Z'), budgetCents: 15_000 })
    await insertBid(ctx.db, { campaignId: campaign.id, feeCents: 10_000, placedAt: new Date('2026-01-01T00:00:00Z') })
    await insertBid(ctx.db, { campaignId: campaign.id, feeCents: 10_000, placedAt: new Date('2026-01-01T00:00:01Z') })

    const result = await closeNextDue(ctx, noExclude)

    expect(result).toEqual({ kind: 'closed', campaignId: campaign.id, winners: 1, spentCents: 10_000 })
    const closed = await ctx.repos.campaigns.getById(campaign.id as CampaignId)
    expect(closed).toMatchObject({ status: 'closed', outcome: { spentCents: 10_000, scoringVersion: SCORING_VERSION } })
    expect(await ctx.repos.bids.listPending(campaign.id as CampaignId)).toEqual([])
  })

  it('leaves campaigns before their deadline open', async () => {
    ctx.clock.set(new Date('2026-01-01T23:59:59Z'))
    await insertCampaign(ctx.db, { biddingDeadline: new Date('2026-01-02T00:00:00Z') })

    expect(await closeNextDue(ctx, noExclude)).toEqual({ kind: 'idle' })
  })

  it('closes a campaign exactly once under concurrent closers', async () => {
    ctx.clock.set(new Date('2026-01-03T00:00:00Z'))
    const campaign = await insertCampaign(ctx.db, { biddingDeadline: new Date('2026-01-02T00:00:00Z') })
    await insertBid(ctx.db, { campaignId: campaign.id })

    const results = await Promise.all([closeNextDue(ctx, noExclude), closeNextDue(ctx, noExclude)])

    expect(results.map(r => r.kind).sort()).toEqual(['closed', 'idle'])
  })

  it('closes exactly the past-due seeded campaigns', async () => {
    const now = new Date('2026-10-01T12:00:00Z')
    await seed(ctx.db, { now })
    ctx.clock.set(now)
    const pastDue = (await listCampaigns(ctx.db)).filter(c => c.biddingDeadline <= now).map(c => c.id)

    const closed: string[] = []
    for (let r = await closeNextDue(ctx, noExclude); r.kind === 'closed'; r = await closeNextDue(ctx, noExclude))
      closed.push(r.campaignId)

    expect(closed.sort()).toEqual(pastDue.sort())

    const bids = await listBids(ctx.db)
    const statusesOf = (id: string) => bids.filter(b => b.campaignId === id).map(b => b.lossReason ?? b.status)
    const [empty, ...contested] = pastDue.map(statusesOf).sort((a, b) => a.length - b.length)
    expect(empty).toEqual([])
    expect(contested).toHaveLength(2)
    for (const statuses of contested)
      expect(statuses).toEqual(expect.arrayContaining(['won', 'over_budget']))
  })
})
