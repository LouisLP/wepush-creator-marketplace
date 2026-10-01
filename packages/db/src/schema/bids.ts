import type { Factor } from '@wepush/domain'
import { sql } from 'drizzle-orm'
import { bigint, check, doublePrecision, index, integer, jsonb, pgTable, unique, uuid } from 'drizzle-orm/pg-core'
import { campaigns } from './campaigns.ts'
import { id, timestamps, timestamptz } from './columns.ts'
import { creators } from './creators.ts'
import { bidStatus, lossReason } from './enums.ts'

export const bids = pgTable('bids', {
  id: id(),
  campaignId: uuid().notNull().references(() => campaigns.id),
  creatorId: uuid().notNull().references(() => creators.id),
  feeCents: bigint({ mode: 'number' }).notNull(),
  placedAt: timestamptz().notNull(),
  // Bid Snapshot
  followers: integer().notNull(),
  engagementRate: doublePrecision().notNull(),
  estimatedImpressions: bigint({ mode: 'number' }).notNull(),
  effectiveCpmCents: bigint({ mode: 'number' }).notNull(),
  // Outcome, written at Closing
  status: bidStatus().notNull().default('pending'),
  score: doublePrecision(),
  rank: integer(),
  lossReason: lossReason(),
  scoreFactors: jsonb().$type<Factor[]>(),
  ...timestamps,
}, t => [
  unique('bids_campaign_creator_unique').on(t.campaignId, t.creatorId),
  index('bids_creator_id_idx').on(t.creatorId),
  check('bids_fee_check', sql`${t.feeCents} > 0`),
  check('bids_loss_reason_check', sql`(${t.status} = 'lost') = (${t.lossReason} is not null)`),
])
