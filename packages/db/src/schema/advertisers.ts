import { pgTable, text } from 'drizzle-orm/pg-core'
import { id, timestamps } from './columns.ts'

export const advertisers = pgTable('advertisers', {
  id: id(),
  name: text().notNull(),
  ...timestamps,
})
