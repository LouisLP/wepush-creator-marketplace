import { describe, expect, it } from 'vitest'
import { formatCentsShort, formatTimeLeft, formatVsTarget } from './format.ts'

describe('formatCentsShort', () => {
  it.each([
    [15_000, '$150'],
    [13_050, '$130.50'],
    [0, '$0'],
  ])('%i → %s', (cents, expected) => {
    expect(formatCentsShort(cents)).toBe(expected)
  })
})

describe('formatVsTarget', () => {
  it.each([
    [1_000, 'at target'],
    [800, '20% under target'],
    [1_250, '25% over target'],
  ])('%i vs 1000 → %s', (cpm, expected) => {
    expect(formatVsTarget(cpm, 1_000)).toBe(expected)
  })
})

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
