import type { CampaignId, Cents } from '@wepush/domain'
import { checkRequirements, feeRange, isWithinFeeRange } from '@wepush/domain'
import { asc } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { advertisers, creators } from '../schema/index.ts'
import { createTestContext, insertCreator, listBids, listCampaigns } from '../testing/index.ts'
import { seed } from './seed.ts'

const ctx = createTestContext()
beforeEach(() => ctx.reset())
afterAll(() => ctx.close())

const now = new Date('2026-10-01T12:00:00Z')

async function dump() {
  return {
    advertisers: await ctx.db.select().from(advertisers).orderBy(asc(advertisers.id)),
    creators: await ctx.db.select().from(creators).orderBy(asc(creators.id)),
    campaigns: await listCampaigns(ctx.db),
    bids: await listBids(ctx.db),
  }
}

describe('seed', () => {
  it('wipes existing data and gives identical rows on every run', async () => {
    await insertCreator(ctx.db, { handle: '@made.in.the.ui' })

    await seed(ctx.db, { now })
    const first = await dump()
    await seed(ctx.db, { now })

    expect(await dump()).toEqual(first)
    expect(first.creators.map(c => c.handle)).not.toContain('@made.in.the.ui')
    expect([first.advertisers, first.creators, first.campaigns].map(rows => rows.length)).toEqual([3, 16, 9])
    expect(first.campaigns.every(c => c.status === 'open')).toBe(true)
    expect(first.bids.every(b => b.status === 'pending')).toBe(true)
  })

  it('only seeds Bids that pass the Requirements and Fee bounds checks', async () => {
    await seed(ctx.db, { now })

    const seeded = await listBids(ctx.db)

    expect(seeded.length).toBeGreaterThan(0)
    for (const bid of seeded) {
      const { terms } = (await ctx.repos.campaigns.getById(bid.campaignId as CampaignId))!
      const { profile } = (await ctx.repos.creators.getById(bid.creatorId))!
      expect(checkRequirements(profile, terms.requirements).every(c => c.passed)).toBe(true)
      expect(isWithinFeeRange(bid.feeCents as Cents, feeRange(bid.estimatedImpressions, terms))).toBe(true)
      expect(bid.placedAt < terms.biddingDeadline).toBe(true)
    }
  })

  it('refuses to run in production and leaves data untouched', async () => {
    await insertCreator(ctx.db, { handle: '@keep.me' })

    await expect(seed(ctx.db, { now, env: { NODE_ENV: 'production' } })).rejects.toThrow(/production/)

    expect((await dump()).creators.map(c => c.handle)).toEqual(['@keep.me'])
  })
})
