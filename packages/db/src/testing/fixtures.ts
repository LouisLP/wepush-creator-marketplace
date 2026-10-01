import type { DbExecutor } from '../client.ts'
import { randomUUID } from 'node:crypto'
import { asc } from 'drizzle-orm'
import { advertisers, bids, campaigns, creators } from '../schema/index.ts'

export async function insertAdvertiser(db: DbExecutor, overrides: Partial<typeof advertisers.$inferInsert> = {}) {
  const [row] = await db.insert(advertisers).values({ name: 'Acme', ...overrides }).returning()
  return row!
}

export async function insertCreator(db: DbExecutor, overrides: Partial<typeof creators.$inferInsert> = {}) {
  const [row] = await db.insert(creators).values({
    handle: `@creator.${randomUUID().slice(0, 8)}`,
    platform: 'tiktok',
    category: 'food',
    followers: 50_000,
    engagementRate: 0.05,
    ...overrides,
  }).returning()
  return row!
}

export async function insertCampaign(db: DbExecutor, overrides: Partial<typeof campaigns.$inferInsert> = {}) {
  const advertiserId = overrides.advertiserId ?? (await insertAdvertiser(db)).id
  const [row] = await db.insert(campaigns).values({
    advertiserId,
    title: 'Test campaign',
    brief: 'Make a post.',
    platform: 'tiktok',
    categories: ['food'],
    minFollowers: 1_000,
    budgetCents: 100_000,
    targetCpmCents: 1_000,
    biddingDeadline: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  }).returning()
  return row!
}

export async function insertBid(db: DbExecutor, overrides: Partial<typeof bids.$inferInsert> & { campaignId: string }) {
  const creatorId = overrides.creatorId ?? (await insertCreator(db)).id
  const [row] = await db.insert(bids).values({
    creatorId,
    feeCents: 10_000,
    placedAt: new Date('2026-01-01T00:00:00Z'),
    followers: 50_000,
    engagementRate: 0.05,
    estimatedImpressions: 10_000,
    effectiveCpmCents: 1_000,
    ...overrides,
  }).returning()
  return row!
}

export async function listCampaigns(db: DbExecutor) {
  return db.select().from(campaigns).orderBy(asc(campaigns.id))
}

export async function listBids(db: DbExecutor) {
  return db.select().from(bids).orderBy(asc(bids.id))
}
