import type { CreatorCampaign, MatchedCampaign } from '@wepush/contracts'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import router from '@/router'
import { useIdentityStore } from '@/stores/identity.ts'
import CampaignReviewPage from './CampaignReviewPage.vue'
import CreatorWorkspace from './CreatorWorkspace.vue'

const ID = '01900000-0000-7000-8000-000000000001'
const relevance = {
  value: 75,
  factors: [
    { key: 'payout', value: 0.58, weight: 0.6, contribution: 35 },
    { key: 'budget_fit', value: 1, weight: 0.4, contribution: 40 },
  ],
} satisfies MatchedCampaign['relevance']

const matched: MatchedCampaign = {
  id: ID,
  title: 'Snack launch',
  advertiserName: 'Glow Cosmetics',
  platform: 'tiktok',
  budgetCents: 100_000,
  targetCpmCents: 1_000,
  biddingDeadline: '2026-01-04T12:00:00.000Z',
  relevance,
  suggestedFeeCents: 7_500,
}

const review: CreatorCampaign = {
  id: ID,
  title: 'Snack launch',
  advertiserName: 'Glow Cosmetics',
  brief: 'Show the snack.',
  status: 'open',
  requirements: { platform: 'tiktok', categories: ['food'], minFollowers: 60_000, minEngagementRate: null },
  budgetCents: 100_000,
  targetCpmCents: 1_000,
  biddingDeadline: '2026-01-04T12:00:00.000Z',
  requirementChecks: [
    { requirement: 'platform', passed: true, actual: 'tiktok', required: 'tiktok' },
    { requirement: 'category', passed: true, actual: 'food', required: ['food'] },
    { requirement: 'minFollowers', passed: false, actual: 50_000, required: 60_000 },
    { requirement: 'minEngagement', passed: true, actual: 0.05, required: null },
  ],
  relevance,
  feeQuote: { estimatedImpressions: 7_500, suggestedFeeCents: 7_500, minFeeCents: 1_000, maxFeeCents: 22_500 },
  hasBid: false,
}

function stubApi(detail: CreatorCampaign = review) {
  const fetch = vi.fn(async (url: string) => Response.json(url.endsWith('/matched') ? { items: [matched] } : detail))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

function mountWith(component: object, props: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useIdentityStore().set('creator', { id: '01900000-0000-7000-8000-0000000000c1', name: '@mia.cooks' })
  return mount(component, { props, global: { plugins: [pinia, router], stubs: { RouterView: true } } })
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('matched campaign rail', () => {
  it('shows Relevance, title, Suggested Fee and time left, linking to the review pane', async () => {
    stubApi()
    const wrapper = mountWith(CreatorWorkspace)
    await flushPromises()

    const item = wrapper.get('nav li')
    expect(item.text()).toContain('75')
    expect(item.text()).toContain('Snack launch')
    expect(item.text()).toContain('$75.00 suggested · 3d left')
    expect(item.get('a').attributes('href')).toBe(`/creator/campaigns/${ID}`)
  })
})

describe('campaign review pane', () => {
  it('shows the Fee Quote, every Requirement checked and the Relevance factors', async () => {
    const fetch = stubApi()
    const wrapper = mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(`/api/creator/campaigns/${ID}`, expect.anything())
    const text = wrapper.text()
    expect(text).toContain('Show the snack.')
    expect(text).toContain('$75.00')
    expect(text).toContain('$10.00 – $225.00')
    expect(wrapper.findAll('.checks li').map(li => li.classes())).toEqual([['pass'], ['pass'], ['miss'], ['pass']])
    expect(text).toContain('At least 60K followers')
    expect(wrapper.findAll('meter')).toHaveLength(2)
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Review')
    expect(wrapper.get('button').text()).toBe('Bid on this Campaign')
  })

  it('moves on to Track once the creator has bid', async () => {
    stubApi({ ...review, hasBid: true })
    const wrapper = mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('[aria-current="step"]').text()).toContain('Track')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows not-found when the Campaign isn’t visible', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { type: 'about:blank', title: 'Not Found', status: 404, detail: 'Campaign not found', code: 'not_found', requestId: 'r1' },
      { status: 404 },
    )))
    const wrapper = mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('We couldn’t find that.')
  })
})
