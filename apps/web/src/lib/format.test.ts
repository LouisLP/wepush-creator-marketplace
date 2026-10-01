import { describe, expect, it } from 'vitest'
import { formatTimeLeft } from './format.ts'

describe('formatTimeLeft', () => {
  const now = new Date('2026-01-01T12:00:00Z')
  const at = (ms: number) => new Date(now.getTime() + ms).toISOString()

  it.each([
    [-1, 'bidding closed'],
    [0, 'bidding closed'],
    [90_000, '2m left'],
    [3 * 3_600_000, '3h left'],
    [47 * 3_600_000, '47h left'],
    [3 * 86_400_000, '3d left'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatTimeLeft(at(ms), now)).toBe(expected)
  })
})
