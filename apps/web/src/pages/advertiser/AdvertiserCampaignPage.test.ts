import type { AdvertiserBid, AdvertiserCampaign } from '@wepush/contracts'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import router from '@/router'
import AdvertiserCampaignPage from './AdvertiserCampaignPage.vue'

const ID = '01900000-0000-7000-8000-000000000001'
const ADVERTISER_ID = '01900000-0000-7000-8000-0000000000a1'

function bid(rank: number, handle: string, overrides: Partial<AdvertiserBid> = {}): AdvertiserBid {
  return {
    id: `01900000-0000-7000-8000-00000000010${rank}`,
    handle,
    category: 'food',
    feeCents: 5_000,
    placedAt: '2026-01-01T00:00:00.000Z',
    snapshot: { followers: 50_000, engagementRate: 0.05, estimatedImpressions: 10_000, effectiveCpmCents: 500 },
    rank,
    score: 80,
    factors: [
      { key: 'cpm_fit', value: 1, weight: 0.75, contribution: 75 },
      { key: 'engagement', value: 0.2, weight: 0.25, contribution: 5 },
    ],
    status: 'won',
    lossReason: null,
    remainingBudgetCents: 15_000,
    ...overrides,
  }
}

const open: AdvertiserCampaign = {
  id: ID,
  title: 'Snack launch',
  brief: 'Show the snack.',
  status: 'open',
  requirements: { platform: 'tiktok', categories: ['food'], minFollowers: 1_000, minEngagementRate: null },
  budgetCents: 15_000,
  targetCpmCents: 1_000,
  biddingDeadline: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  closedAt: null,
  provisional: true,
  scoringVersion: 'v1',
  outcome: { spentCents: 13_000, winnerCount: 2, estimatedImpressions: 20_000, blendedCpmCents: 650 },
  bids: [
    bid(1, '@cheap'),
    bid(2, '@mid', { feeCents: 8_000, remainingBudgetCents: 10_000 }),
    bid(3, '@pricey', { feeCents: 10_000, status: 'lost', lossReason: 'over_budget', remainingBudgetCents: 2_000 }),
    bid(4, '@tiny', { status: 'lost', lossReason: 'requirements_not_met', remainingBudgetCents: null }),
  ],
}

const closed: AdvertiserCampaign = { ...open, status: 'closed', provisional: false, closedAt: '2026-01-02T00:00:05.000Z' }

function stubApi(...responses: AdvertiserCampaign[]) {
  const fetch = vi.fn(async () => Response.json(responses.length > 1 ? responses.shift() : responses[0]))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

async function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  await router.push(`/advertisers/${ADVERTISER_ID}/campaigns/${ID}`)
  const wrapper = mount(AdvertiserCampaignPage, { props: { id: ID }, global: { plugins: [pinia, router] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('advertiser campaign page', () => {
  it('shows the provisional outcome, the Budget filled in Rank order, and the Bids', async () => {
    const fetch = stubApi(open)
    const wrapper = await mountPage()

    expect(fetch).toHaveBeenCalledWith(`/api/advertiser/campaigns/${ID}`, expect.objectContaining({
      headers: expect.objectContaining({ 'x-advertiser-id': ADVERTISER_ID }),
    }))
    const outcome = wrapper.get('#outcome-heading').element.closest('section')!
    expect(outcome.textContent).toContain('If it closed now')
    expect(outcome.textContent).toContain('Spent (projected)$130.00 of $150.00')
    expect(outcome.textContent).toContain('2 of 4 Bids')
    expect(outcome.textContent).toContain('$6.50 target $10.00')
    expect(wrapper.findAll('.segment').map(s => [s.text(), s.attributes('style')])).toEqual([
      ['#1', 'inline-size: 33.33%;'],
      ['#2', 'inline-size: 53.33%;'],
    ])
    expect(wrapper.findAll('.winners li').map(li => li.text())).toEqual([
      '#1@cheap$50.00 · 10K Est. Impressions · Effective CPM $5.00',
      '#2@mid$80.00 · 10K Est. Impressions · Effective CPM $5.00',
    ])
    expect(wrapper.findAll('tbody tr').map(tr => tr.text())).toEqual([
      expect.stringContaining('Would win'),
      expect.stringContaining('Would win'),
      expect.stringContaining('Fee didn’t fit the Remaining Budget'),
      expect.stringContaining('Snapshot didn’t meet the Requirements'),
    ])
    expect(wrapper.text()).toContain('Open · 12h left')
    expect(wrapper.text()).toContain('Show the snack.')
  })

  it('expands a Bid to show its Score factors, Remaining Budget and Loss Reason', async () => {
    stubApi(open)
    const wrapper = await mountPage()

    const toggle = wrapper.findAll('button.toggle')[2]!
    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    const detail = wrapper.get(`#${toggle.attributes('aria-controls')}`)
    expect(detail.findAll('meter')).toHaveLength(2)
    expect(detail.text()).toContain('Remaining Budget when reached$20.00')
    expect(detail.text()).toContain('Loss ReasonFee didn’t fit the Remaining Budget')
  })

  it('shows final Winners once Closed', async () => {
    stubApi(closed)
    const wrapper = await mountPage()

    expect(wrapper.get('#outcome-heading').text()).toBe('Winners')
    expect(wrapper.text()).toContain('Spent$130.00 of $150.00')
    expect(wrapper.text()).toContain('Scoring Version v1')
    expect(wrapper.findAll('tbody tr').map(tr => tr.text())).toEqual([
      expect.stringContaining('Won'),
      expect.stringContaining('Won'),
      expect.stringContaining('Lost'),
      expect.stringContaining('Lost'),
    ])
  })

  it('switches to closing shortly when the deadline passes while the page is open', async () => {
    vi.setSystemTime(new Date('2026-01-01T23:59:58Z'))
    const fetch = stubApi(open)
    const wrapper = await mountPage()
    expect(wrapper.get('[role="status"]').text()).toBe('Open · 1m left')

    await vi.advanceTimersByTimeAsync(5_000)
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe('Bidding over · closing shortly')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('says closing shortly past the deadline, and picks up the Winners once Closed', async () => {
    vi.setSystemTime(new Date('2026-01-02T00:00:01Z'))
    const fetch = stubApi(open, closed)
    const wrapper = await mountPage()

    expect(wrapper.get('[role="status"]').text()).toBe('Bidding over · closing shortly')

    await vi.advanceTimersByTimeAsync(5_000)
    await flushPromises()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(wrapper.get('#outcome-heading').text()).toBe('Winners')
    expect(wrapper.get('[role="status"]').text()).toBe('Closed')
  })

  it('shows not-found for another Advertiser’s Campaign', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { type: 'about:blank', title: 'Not Found', status: 404, detail: 'Campaign not found', code: 'not_found', requestId: 'r1' },
      { status: 404 },
    )))
    const wrapper = await mountPage()

    expect(wrapper.get('[role="alert"]').text()).toBe('We couldn’t find that.')
  })
})
