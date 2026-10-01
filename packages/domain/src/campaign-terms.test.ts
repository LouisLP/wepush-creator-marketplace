import { describe, expect, it } from 'vitest'
import { checkBiddingDeadline } from './campaign-terms.ts'

const now = new Date('2026-01-01T12:00:00Z')
const at = (ms: number) => new Date(now.getTime() + ms)
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

describe('checkBiddingDeadline', () => {
  it('accepts deadlines inside the bidding window, bounds included', () => {
    for (const deadline of [at(5 * MINUTE), at(3 * DAY), at(30 * DAY)])
      expect(checkBiddingDeadline(deadline, now)).toEqual({ ok: true, value: deadline })
  })

  it('rejects a deadline at or before now as in the past', () => {
    expect(checkBiddingDeadline(now, now)).toEqual({ ok: false, error: 'deadline_in_past' })
    expect(checkBiddingDeadline(at(-1), now)).toEqual({ ok: false, error: 'deadline_in_past' })
  })

  it('rejects deadlines too soon or too far as out of range', () => {
    expect(checkBiddingDeadline(at(MINUTE), now)).toEqual({ ok: false, error: 'deadline_out_of_range' })
    expect(checkBiddingDeadline(at(30 * DAY + 1), now)).toEqual({ ok: false, error: 'deadline_out_of_range' })
  })
})
