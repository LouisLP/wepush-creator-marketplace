import { sql } from 'drizzle-orm'
import { check, doublePrecision, integer, pgTable, text, unique } from 'drizzle-orm/pg-core'
import { id, timestamps } from './columns.ts'
import { category, platform } from './enums.ts'

export const creators = pgTable('creators', {
  id: id(),
  handle: text().notNull(),
  platform: platform().notNull(),
  category: category().notNull(),
  followers: integer().notNull(),
  engagementRate: doublePrecision().notNull(),
  ...timestamps,
}, t => [
  unique('creators_handle_unique').on(t.handle),
  check('creators_followers_check', sql`${t.followers} >= 0`),
  check('creators_engagement_rate_check', sql`${t.engagementRate} between 0 and 1`),
])
