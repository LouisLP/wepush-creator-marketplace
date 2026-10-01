import type { Db } from './client.ts'
import { createDb } from './client.ts'
import { loadConfig } from './config.ts'
import { advertisers, bids, campaigns, creators } from './schema/index.ts'

const id = (n: number) => `01900000-0000-7000-8000-${String(n).padStart(12, '0')}`

// Idempotent: fixed ids + ON CONFLICT DO NOTHING. Re-run after `infra:reset` for a fresh demo Campaign.
export async function seed(db: Db, now = new Date()) {
  await db.insert(advertisers).values([
    { id: id(1), name: 'Glow Cosmetics' },
    { id: id(2), name: 'Fuel Fitness' },
  ]).onConflictDoNothing()

  await db.insert(creators).values([
    { id: id(11), handle: '@mia.cooks', platform: 'tiktok', category: 'food', followers: 120_000, engagementRate: 0.064 },
    { id: id(12), handle: '@liftwithleo', platform: 'instagram', category: 'fitness', followers: 48_000, engagementRate: 0.041 },
    { id: id(13), handle: '@glowbyana', platform: 'tiktok', category: 'beauty', followers: 310_000, engagementRate: 0.052 },
  ]).onConflictDoNothing()

  await db.insert(campaigns).values({
    id: id(21),
    advertiserId: id(1),
    title: 'Summer glow launch',
    brief: 'Show our new SPF serum in your morning routine.',
    platform: 'tiktok',
    categories: ['beauty', 'lifestyle'],
    minFollowers: 10_000,
    budgetCents: 500_000,
    targetCpmCents: 1_500,
    biddingDeadline: new Date(now.getTime() + 2 * 60_000),
  }).onConflictDoNothing()

  await db.insert(bids).values({
    id: id(31),
    campaignId: id(21),
    creatorId: id(13),
    feeCents: 250_000,
    placedAt: now,
    followers: 310_000,
    engagementRate: 0.052,
    estimatedImpressions: 155_000,
    effectiveCpmCents: 1_613,
  }).onConflictDoNothing()
}

if (import.meta.main) {
  const { db, pool } = createDb(loadConfig().databaseUrl, { max: 1 })
  try {
    await seed(db)
    console.log('Seed applied')
  }
  finally {
    await pool.end()
  }
}
