import type { CampaignId, CampaignTerms } from '@wepush/domain'
import type { Db } from '../client.ts'
import process from 'node:process'
import { cents, checkBidPlacement, estimateImpressions, parityFeeCents } from '@wepush/domain'
import { sql } from 'drizzle-orm'
import { createDb } from '../client.ts'
import { loadConfig } from '../config.ts'
import { advertisers, bids, campaigns, creators } from '../schema/index.ts'
import { ADVERTISERS, CAMPAIGNS, CAST_CREATED_AT, CREATORS } from './fixtures.ts'

const ID_PREFIX = { advertiser: 'a', creator: 'c', campaign: 'e', bid: 'b' } as const

function seedId(kind: keyof typeof ID_PREFIX, n: number) {
  return `01900000-0000-7000-8000-${ID_PREFIX[kind]}${String(n).padStart(11, '0')}`
}

/** Builds every row from the fixtures; throws if a fixture Bid would be refused by the API. */
function buildSeed(now: Date) {
  const at = (offset: number) => new Date(now.getTime() + offset)
  const stamps = (offset: number) => ({ createdAt: at(offset), updatedAt: at(offset) })

  const advertiserIds = new Map(ADVERTISERS.map((a, i) => [a.key, seedId('advertiser', i + 1)]))
  const creatorIds = new Map(CREATORS.map((c, i) => [c.handle, seedId('creator', i + 1)]))
  const creatorsByHandle = new Map(CREATORS.map(c => [c.handle, c]))
  const lookup = <T>(map: Map<string, T>, key: string) => {
    const value = map.get(key)
    if (value === undefined)
      throw new Error(`Seed fixture references unknown "${key}"`)
    return value
  }

  const advertiserRows = ADVERTISERS.map(a => ({ id: lookup(advertiserIds, a.key), name: a.name, ...stamps(CAST_CREATED_AT) }))
  const creatorRows = CREATORS.map(({ handle, ...profile }) => ({ id: lookup(creatorIds, handle), handle, ...profile, ...stamps(CAST_CREATED_AT) }))
  const campaignRows: (typeof campaigns.$inferInsert)[] = []
  const bidRows: (typeof bids.$inferInsert)[] = []

  CAMPAIGNS.forEach((c, i) => {
    const id = seedId('campaign', i + 1)
    const terms: CampaignTerms = {
      id: id as CampaignId,
      requirements: { platform: c.platform, categories: c.categories, minFollowers: c.minFollowers, minEngagementRate: c.minEngagementRate },
      budgetCents: cents(c.budgetCents),
      targetCpmCents: cents(c.targetCpmCents),
      biddingDeadline: at(c.biddingDeadline),
    }
    campaignRows.push({
      id,
      advertiserId: lookup(advertiserIds, c.advertiser),
      title: c.title,
      brief: c.brief,
      ...terms.requirements,
      budgetCents: terms.budgetCents,
      targetCpmCents: terms.targetCpmCents,
      biddingDeadline: terms.biddingDeadline,
      ...stamps(c.createdAt),
    })

    const bidders = new Set<string>()
    for (const b of c.bids) {
      const creator = lookup(creatorsByHandle, b.creator)
      if (b.placedAt <= c.createdAt)
        throw new Error(`Seed Bid ${b.creator} on ${c.key} is placed before the Campaign exists`)

      const feeCents = cents(Math.round(parityFeeCents(estimateImpressions(creator), terms.targetCpmCents) * b.m))
      const placed = checkBidPlacement({
        creator,
        campaign: { status: 'open', terms },
        feeCents,
        now: at(b.placedAt),
        alreadyBid: bidders.has(b.creator),
      })
      if (!placed.ok)
        throw new Error(`Seed Bid ${b.creator} on ${c.key} refused: ${placed.error.code}`)
      bidders.add(b.creator)

      bidRows.push({
        id: seedId('bid', bidRows.length + 1),
        campaignId: id,
        creatorId: lookup(creatorIds, b.creator),
        feeCents,
        placedAt: at(b.placedAt),
        ...placed.value,
        ...stamps(b.placedAt),
      })
    }
  })

  return { advertisers: advertiserRows, creators: creatorRows, campaigns: campaignRows, bids: bidRows }
}

export interface SeedCounts {
  advertisers: number
  creators: number
  campaigns: number
  bids: number
}

export interface SeedOptions {
  now?: Date
  env?: NodeJS.ProcessEnv
}

/** Wipes all marketplace data and reinserts the demo fixtures in one transaction. */
export async function seed(db: Db, { now = new Date(), env = process.env }: SeedOptions = {}): Promise<SeedCounts> {
  if (env.NODE_ENV === 'production')
    throw new Error('Refusing to seed: NODE_ENV=production')

  const rows = buildSeed(now)
  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE ${advertisers}, ${creators}, ${campaigns}, ${bids} CASCADE`)
    await tx.insert(advertisers).values(rows.advertisers)
    await tx.insert(creators).values(rows.creators)
    await tx.insert(campaigns).values(rows.campaigns)
    await tx.insert(bids).values(rows.bids)
  })
  return { advertisers: rows.advertisers.length, creators: rows.creators.length, campaigns: rows.campaigns.length, bids: rows.bids.length }
}

if (import.meta.main) {
  const { db, pool } = createDb(loadConfig().databaseUrl, { max: 1 })
  try {
    const counts = await seed(db)
    console.log(`Seeded ${counts.advertisers} advertisers, ${counts.creators} creators, ${counts.campaigns} campaigns, ${counts.bids} bids`)
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
  finally {
    await pool.end()
  }
}
