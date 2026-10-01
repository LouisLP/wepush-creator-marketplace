import type { CampaignId, Cents } from '@wepush/domain'
import { checkRequirements, feeRange, isWithinFeeRange } from '@wepush/domain'
import { asc, eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { advertisers, bids, campaigns, creators } from '../schema/index.ts'
import { createTestContext, insertCreator } from '../testing/index.ts'
import { seed } from './seed.ts'

const ctx = createTestContext()
beforeEach(() => ctx.reset())
afterAll(() => ctx.close())

const now = new Date('2026-10-01T12:00:00Z')

async function dump() {
  return {
    advertisers: await ctx.db.select().from(advertisers).orderBy(asc(advertisers.id)),
    creators: await ctx.db.select().from(creators).orderBy(asc(creators.id)),
    campaigns: await ctx.db.select().from(campaigns).orderBy(asc(campaigns.id)),
    bids: await ctx.db.select().from(bids).orderBy(asc(bids.id)),
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

    const rows = await ctx.db.select().from(bids).innerJoin(campaigns, eq(bids.campaignId, campaigns.id)).innerJoin(creators, eq(bids.creatorId, creators.id))

    expect(rows.length).toBeGreaterThan(0)
    for (const { bids: bid, campaigns: campaign, creators: creator } of rows) {
      const terms = {
        id: campaign.id as CampaignId,
        requirements: { platform: campaign.platform, categories: campaign.categories, minFollowers: campaign.minFollowers, minEngagementRate: campaign.minEngagementRate },
        budgetCents: campaign.budgetCents as Cents,
        targetCpmCents: campaign.targetCpmCents as Cents,
        biddingDeadline: campaign.biddingDeadline,
      }
      expect(checkRequirements({ ...creator, ...bid }, terms.requirements).every(c => c.passed)).toBe(true)
      expect(isWithinFeeRange(bid.feeCents as Cents, feeRange(bid.estimatedImpressions, terms))).toBe(true)
      expect(bid.placedAt < campaign.biddingDeadline).toBe(true)
    }
  })

  it('refuses to run in production and leaves data untouched', async () => {
    await insertCreator(ctx.db, { handle: '@keep.me' })

    await expect(seed(ctx.db, { now, env: { NODE_ENV: 'production' } })).rejects.toThrow(/production/)

    expect((await dump()).creators.map(c => c.handle)).toEqual(['@keep.me'])
  })
})
