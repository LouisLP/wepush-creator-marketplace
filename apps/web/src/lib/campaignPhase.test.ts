import { describe, expect, it } from 'vitest'
import { campaignPhase } from './campaignPhase.ts'

describe('campaignPhase', () => {
  const now = new Date('2026-01-01T12:00:00Z')
  const at = (ms: number) => new Date(now.getTime() + ms).toISOString()

  it.each([
    ['open', 25 * 3_600_000, 'open'],
    ['open', 24 * 3_600_000, 'open'],
    ['open', 23 * 3_600_000, 'closing-soon'],
    ['open', 0, 'closing'],
    ['open', -1, 'closing'],
    ['closed', -1, 'closed'],
  ] as const)('%s, deadline in %i ms → %s', (status, ms, expected) => {
    expect(campaignPhase(status, at(ms), now)).toBe(expected)
  })
})
