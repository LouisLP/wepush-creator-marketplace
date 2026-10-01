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
  it('shows the state badges, the provisional outcome, the Budget filled in Rank order, and the Bids', async () => {
    const fetch = stubApi(open)
    const wrapper = await mountPage()

    expect(fetch).toHaveBeenCalledWith(`/api/advertiser/campaigns/${ID}`, expect.objectContaining({
      headers: expect.objectContaining({ 'x-advertiser-id': ADVERTISER_ID }),
    }))
    expect(wrapper.findAll('.head .badge').map(b => b.text())).toEqual(['Closing soon · 12h left', 'TikTok', 'Food'])
    const outcome = wrapper.get('#outcome-heading').element.closest('section')!
    expect(outcome.textContent).toContain('If it closed now Projected')
    expect(outcome.textContent).toContain('Spent$130 / $150')
    expect(outcome.textContent).toContain('Winners2 / 4 Bids')
    expect(outcome.textContent).toContain('Est. Impressions20K')
    expect(outcome.textContent).toContain('Blended CPM$6.50 35% under target')
    expect(wrapper.findAll('.segment').map(s => [s.text(), s.attributes('style')])).toEqual([
      ['#1', 'inline-size: 33.33%;'],
      ['#2', 'inline-size: 53.33%;'],
    ])
    expect(wrapper.find('.winners').exists()).toBe(false)
    expect(wrapper.findAll('tbody .row').map(tr => tr.text())).toEqual([
      '#1@cheap$5050%50% under target80Would win',
      '#2@mid$8050%50% under target80Would win',
      '#3@pricey$10050%50% under target80Would loseOver budgetFee didn’t fit the Remaining Budget',
      '#4@tiny$5050%50% under target80Would loseRequirementsSnapshot didn’t meet the Requirements',
    ])
  })

  it('expands a Bid to show its snapshot, Score factors and Remaining Budget', async () => {
    stubApi(open)
    const wrapper = await mountPage()

    const toggle = wrapper.findAll('button.toggle')[2]!
    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    const detail = wrapper.get(`#${toggle.attributes('aria-controls')}`)
    expect(detail.findAll('meter')).toHaveLength(2)
    expect(detail.text()).toContain('Bid Snapshot50K followers · 5% engagement')
    expect(detail.text()).toContain('Est. Impressions10K')
    expect(detail.text()).toContain('Budget left when reached$20')

    await toggle.trigger('click')
    expect(wrapper.find(`#${toggle.attributes('aria-controls')}`).exists()).toBe(false)
  })

  it('leaves out Budget left for a Bid that was never reached', async () => {
    stubApi(open)
    const wrapper = await mountPage()

    await wrapper.findAll('tbody .row')[3]!.trigger('click')

    expect(wrapper.get('.detail').text()).not.toContain('Budget left')
  })

  it('keeps the Terms collapsed behind a summary line', async () => {
    stubApi(open)
    const wrapper = await mountPage()

    const trigger = wrapper.get('.terms button')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.text()).toMatch(/^Terms\$150 · \$10\.00 CPM · /)
    expect(wrapper.text()).not.toContain('Show the snack.')

    await trigger.trigger('click')

    expect(wrapper.text()).toContain('Show the snack.')
    expect(wrapper.text()).toContain('≥ 1K followers')
    expect(wrapper.text()).toContain('Any engagement')
  })

  it('shows the final outcome once Closed', async () => {
    stubApi(closed)
    const wrapper = await mountPage()

    expect(wrapper.get('#outcome-heading').text()).toBe('Outcome')
    expect(wrapper.get('[role="status"]').text()).toBe('Closed')
    expect(wrapper.text()).toContain('Spent$130 / $150')
    expect(wrapper.text()).not.toContain('Projected')
    expect(wrapper.text()).not.toContain('Scoring Version')
    expect(wrapper.findAll('tbody .row').map(tr => tr.findAll('.badges > .badge').map(b => b.text()))).toEqual([
      ['Won'],
      ['Won'],
      ['Lost', 'Over budgetFee didn’t fit the Remaining Budget'],
      ['Lost', 'RequirementsSnapshot didn’t meet the Requirements'],
    ])
  })

  it('switches to closing shortly when the deadline passes while the page is open', async () => {
    vi.setSystemTime(new Date('2026-01-01T23:59:58Z'))
    const fetch = stubApi(open)
    const wrapper = await mountPage()
    expect(wrapper.get('[role="status"]').text()).toBe('Closing soon · 1m left')

    await vi.advanceTimersByTimeAsync(5_000)
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe('Closing shortly')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('says closing shortly past the deadline, and picks up the outcome once Closed', async () => {
    vi.setSystemTime(new Date('2026-01-02T00:00:01Z'))
    const fetch = stubApi(open, closed)
    const wrapper = await mountPage()

    expect(wrapper.get('[role="status"]').text()).toBe('Closing shortly')

    await vi.advanceTimersByTimeAsync(5_000)
    await flushPromises()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(wrapper.get('#outcome-heading').text()).toBe('Outcome')
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
