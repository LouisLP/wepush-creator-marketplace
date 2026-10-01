import type { Clock } from '@wepush/domain'

export interface FakeClock extends Clock {
  set: (date: Date) => void
  advance: (ms: number) => void
}

export function createFakeClock(start = new Date('2026-01-01T12:00:00Z')): FakeClock {
  let current = start
  return {
    now: () => new Date(current),
    set: (date) => { current = date },
    advance: (ms) => { current = new Date(current.getTime() + ms) },
  }
}
