import { sql } from 'drizzle-orm'
import { bigint, check, doublePrecision, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { advertisers } from './advertisers.ts'
import { id, timestamps, timestamptz } from './columns.ts'
import { campaignStatus, category, platform } from './enums.ts'

export const campaigns = pgTable('campaigns', {
  id: id(),
  advertiserId: uuid().notNull().references(() => advertisers.id),
  title: text().notNull(),
  brief: text().notNull(),
  platform: platform().notNull(),
  categories: category().array().notNull(),
  minFollowers: integer().notNull(),
  minEngagementRate: doublePrecision(),
  budgetCents: bigint({ mode: 'number' }).notNull(),
  targetCpmCents: bigint({ mode: 'number' }).notNull(),
  biddingDeadline: timestamptz().notNull(),
  status: campaignStatus().notNull().default('open'),
  spentCents: bigint({ mode: 'number' }),
  closedAt: timestamptz(),
  scoringVersion: text(),
  ...timestamps,
}, t => [
  index('campaigns_advertiser_id_idx').on(t.advertiserId),
  index('campaigns_due_idx').on(t.biddingDeadline, t.id).where(sql`${t.status} = 'open'`),
  check('campaigns_budget_check', sql`${t.budgetCents} > 0`),
  check('campaigns_target_cpm_check', sql`${t.targetCpmCents} > 0`),
  check('campaigns_categories_check', sql`cardinality(${t.categories}) > 0`),
  check('campaigns_spent_check', sql`${t.spentCents} <= ${t.budgetCents}`),
  check('campaigns_closed_check', sql`(${t.status} = 'closed') = (${t.closedAt} is not null)`),
])
