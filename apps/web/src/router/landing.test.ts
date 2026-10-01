import { describe, expect, it } from 'vitest'
import { landingFor } from '@/router'

describe('landingFor', () => {
  it.each([
    '/creator',
    '/creator/campaigns/abc',
    '/creator?tab=bids',
    '/creator#matched',
  ])('honours %s for a creator', (redirect) => {
    expect(landingFor('creator', redirect)).toBe(redirect)
  })

  it.each([
    undefined,
    ['/creator/x'],
    '/advertiser/campaigns',
    '/creatorish',
    'https://example.com/creator',
    '//example.com/creator',
  ])('falls back to the role home for %s', (redirect) => {
    expect(landingFor('creator', redirect)).toBe('/creator')
  })
})
