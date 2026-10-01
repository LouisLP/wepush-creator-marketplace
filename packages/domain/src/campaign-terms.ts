import type { Result } from './result.ts'
import { FEE_FLOOR_CENTS } from './pricing.ts'
import { err, ok } from './result.ts'
import { cents } from './types.ts'

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

// Budget starts at the Fee floor so every Campaign can afford at least one Post.
// Target CPM spans well past every Platform's CPM Range; the range itself is only a hint.
export const CAMPAIGN_LIMITS = {
  titleMaxLength: 120,
  briefMaxLength: 2_000,
  minFollowersMax: 10_000_000,
  budgetCents: { min: FEE_FLOOR_CENTS, max: cents(100_000_000) },
  targetCpmCents: { min: cents(100), max: cents(10_000) },
  biddingWindowMs: { min: 5 * MINUTE_MS, max: 30 * DAY_MS },
} as const

export type DeadlineError = 'deadline_in_past' | 'deadline_out_of_range'

export function checkBiddingDeadline(deadline: Date, now: Date): Result<Date, DeadlineError> {
  const { min, max } = CAMPAIGN_LIMITS.biddingWindowMs
  if (deadline <= now)
    return err('deadline_in_past')
  const ms = deadline.getTime() - now.getTime()
  if (ms < min || ms > max)
    return err('deadline_out_of_range')
  return ok(deadline)
}
