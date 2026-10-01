import { sql } from 'drizzle-orm'
import { timestamp, uuid } from 'drizzle-orm/pg-core'

export const id = () => uuid().primaryKey().default(sql`uuidv7()`)

export const timestamptz = () => timestamp({ withTimezone: true, mode: 'date' })

export const timestamps = {
  createdAt: timestamptz().notNull().defaultNow(),
  updatedAt: timestamptz().notNull().defaultNow().$onUpdate(() => new Date()),
}
