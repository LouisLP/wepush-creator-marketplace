import type { CreatorBid, CreatorCampaign, MatchedCampaign, MyBid } from '@wepush/contracts'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import router from '@/router'
import CampaignReviewPage from './CampaignReviewPage.vue'
import CreatorWorkspace from './CreatorWorkspace.vue'

const ID = '01900000-0000-7000-8000-000000000001'
const CREATOR_ID = '01900000-0000-7000-8000-0000000000c1'
const BID_ID = '01900000-0000-7000-8000-0000000000b1'
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
  bid: null,
}

const pendingBid: CreatorBid = {
  id: BID_ID,
  feeCents: 6_000,
  status: 'pending',
  placedAt: '2026-01-01T12:00:00.000Z',
  snapshot: { followers: 50_000, engagementRate: 0.05, estimatedImpressions: 7_500, effectiveCpmCents: 800 },
  outcome: null,
}

const lostBid: CreatorBid = {
  ...pendingBid,
  status: 'lost',
  outcome: {
    rank: 2,
    score: 52.5,
    factors: [
      { key: 'cpm_fit', value: 0.5, weight: 0.75, contribution: 37.5 },
      { key: 'engagement', value: 0.6, weight: 0.25, contribution: 15 },
    ],
    scoringVersion: 'v1',
    lossReason: 'over_budget',
    remainingBudgetCents: 4_000,
  },
}

const myBids: MyBid[] = [
  { id: BID_ID, campaignId: ID, campaignTitle: 'Snack launch', feeCents: 6_000, status: 'lost', rank: 2, biddingDeadline: '2026-01-01T00:00:00.000Z' },
  { id: '01900000-0000-7000-8000-0000000000b2', campaignId: '01900000-0000-7000-8000-000000000002', campaignTitle: 'Lip tint', feeCents: 9_000, status: 'pending', rank: null, biddingDeadline: '2026-01-01T15:00:00.000Z' },
]

function problem(status: number, code: string, extras: object = {}) {
  return Response.json({ type: 'about:blank', title: 'Error', status, detail: code, code, requestId: 'r1', ...extras }, { status })
}

interface Stub {
  detail?: CreatorCampaign
  place?: () => Response
}

function stubApi({ detail = review, place = () => Response.json(pendingBid, { status: 201 }) }: Stub = {}) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST')
      return place()
    if (url.endsWith('/matched'))
      return Response.json({ items: [matched] })
    if (url === '/api/creator/bids')
      return Response.json({ items: myBids })
    return Response.json(detail)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

async function mountWith(component: object, props: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  await router.push(`/creators/${CREATOR_ID}`)
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

describe('creator rail', () => {
  it('shows Relevance, title, Suggested Fee and time left, linking to the review pane', async () => {
    stubApi()
    const wrapper = await mountWith(CreatorWorkspace)
    await flushPromises()

    const item = wrapper.get('nav[aria-labelledby="matched-heading"] li')
    expect(item.text()).toContain('75')
    expect(item.text()).toContain('Snack launch')
    expect(item.text()).toContain('$75.00 suggested · 3d left')
    expect(item.get('a').attributes('href')).toBe(`/creators/${CREATOR_ID}/campaigns/${ID}`)
  })

  it('lists My Bids with a status dot, Fee and Rank or time left', async () => {
    stubApi()
    const wrapper = await mountWith(CreatorWorkspace)
    await flushPromises()

    const items = wrapper.findAll('nav[aria-labelledby="my-bids-heading"] li')
    expect(items.map(li => li.get('.dot').classes())).toEqual([['dot', 'lost'], ['dot', 'pending']])
    expect(items[0]!.text()).toContain('$60.00 · Lost · Rank #2')
    expect(items[1]!.text()).toContain('$90.00 · 3h left')
    expect(items[0]!.get('a').attributes('href')).toBe(`/creators/${CREATOR_ID}/campaigns/${ID}`)
  })

  it('refreshes My Bids once a Pending Bid’s deadline passes', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-01-01T14:59:58Z'))
    const fetch = stubApi()
    const wrapper = await mountWith(CreatorWorkspace)
    await flushPromises()
    const bidsCalls = () => fetch.mock.calls.filter(([url]) => url === '/api/creator/bids').length

    expect(bidsCalls()).toBe(1)
    const closed = myBids.map(b => ({ ...b, status: 'lost' as const, rank: 3 }))
    fetch.mockImplementation(async (url: string) => Response.json({ items: url === '/api/creator/bids' ? closed : [matched] }))
    await vi.advanceTimersByTimeAsync(5_000)
    await flushPromises()

    expect(bidsCalls()).toBe(2)
    expect(wrapper.findAll('nav[aria-labelledby="my-bids-heading"] li')[1]!.text()).toContain('$90.00 · Lost · Rank #3')
    wrapper.unmount()
  })
})

describe('campaign review pane', () => {
  it('shows the Fee Quote, every Requirement checked and the Relevance factors', async () => {
    const fetch = stubApi()
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
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
  })

  it('shows not-found when the Campaign isn’t visible', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => problem(404, 'not_found')))
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('We couldn’t find that.')
  })
})

describe('placing a Bid', () => {
  async function mountComposer(stub?: Stub) {
    const fetch = stubApi(stub)
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()
    return { fetch, wrapper, fee: wrapper.get('input[name="fee"]') }
  }

  it('pre-fills the Suggested Fee and shows live Effective CPM vs Target', async () => {
    const { wrapper, fee } = await mountComposer()

    expect((fee.element as HTMLInputElement).value).toBe('75')
    expect(wrapper.get('.cpm').text()).toContain('Effective CPM $10.00 vs Target $10.00 — at target')

    await fee.setValue('60')
    expect(wrapper.get('.cpm').text()).toContain('Effective CPM $8.00 vs Target $10.00 — 20% under target')
  })

  it('blocks a Fee outside the Fee Range, naming the range', async () => {
    const { wrapper, fee } = await mountComposer()

    await fee.setValue('300')

    expect(wrapper.get('.field-error').text()).toBe('Fee must be between $10.00 and $225.00.')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('confirms before placing, then switches the pane to Pending', async () => {
    const { fetch, wrapper, fee } = await mountComposer()
    await fee.setValue('60')

    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Final, can’t be changed. Place your Bid at $60.00?')
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Bid')
    expect(fetch).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: 'POST' }))

    await wrapper.get('.confirm .btn').trigger('click')
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(`/api/creator/campaigns/${ID}/bids`, expect.objectContaining({ method: 'POST', body: JSON.stringify({ feeCents: 6_000 }) }))
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('.badge').text()).toBe('Pending')
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Track')
    expect(wrapper.text()).toContain('$8.00')
    expect(wrapper.text()).toContain('50K followers · 5%')
  })

  it.each([
    ['fee_out_of_range', 422, { minCents: 1_000, maxCents: 5_000 }, 'Fee must be between $10.00 and $50.00.'],
    ['deadline_passed', 409, {}, 'The bidding deadline has passed.'],
    ['already_bid', 409, {}, 'You’ve already bid on this campaign.'],
    ['campaign_closed', 409, {}, 'This campaign is closed.'],
    ['requirements_not_met', 422, { checks: [] }, 'Your profile doesn’t meet this campaign’s requirements.'],
  ])('shows a %s rejection under the Fee field', async (code, status, extras, message) => {
    const { wrapper } = await mountComposer({ place: () => problem(status, code, extras) })

    await wrapper.get('form').trigger('submit')
    await wrapper.get('.confirm .btn').trigger('click')
    await flushPromises()

    expect(wrapper.get('.field-error').text()).toBe(message)
    expect(wrapper.get('input[name="fee"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.confirm').exists()).toBe(false)
  })
})

describe('tracking a Bid', () => {
  it('shows a Pending Bid with Fee, Effective CPM vs Target, Snapshot and closes-at', async () => {
    stubApi({ detail: { ...review, bid: pendingBid } })
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('[aria-current="step"]').text()).toContain('Track')
    expect(wrapper.find('form').exists()).toBe(false)
    const text = wrapper.text()
    expect(text).toContain('$60.00')
    expect(text).toContain('$8.00 vs $10.00 Target, 20% under target')
    expect(text).toContain('50K followers · 5%')
    expect(text).toContain('3d left')
  })

  it('shows a Lost outcome with Rank, Score factors and the over-budget Loss Reason', async () => {
    stubApi({ detail: { ...review, status: 'closed', bid: lostBid } })
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('[aria-current="step"]').text()).toContain('Outcome')
    expect(wrapper.get('.badge').text()).toBe('Lost · Rank #2')
    expect(wrapper.get('.loss').text()).toBe('Your Fee didn’t fit the Remaining Budget. $40.00 was left when your Bid was reached; you asked $60.00.')
    expect(wrapper.text()).toContain('Score 52.5')
    expect(wrapper.text()).toContain('Scoring Version v1')
    expect(wrapper.findAll('meter')).toHaveLength(4)
  })

  it('picks up the outcome once the worker closes the Campaign after its deadline', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-01-04T11:59:58Z'))
    const fetch = stubApi({ detail: { ...review, bid: pendingBid } })
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    await vi.advanceTimersByTimeAsync(5_000)
    expect(fetch).toHaveBeenCalledTimes(2)
    fetch.mockImplementation(async () => Response.json({ ...review, status: 'closed', bid: lostBid }))
    await vi.advanceTimersByTimeAsync(5_000)
    await flushPromises()

    expect(wrapper.get('.badge').text()).toBe('Lost · Rank #2')
    wrapper.unmount()
  })

  it('shows a Won outcome', async () => {
    const won: CreatorBid = { ...lostBid, status: 'won', outcome: { ...lostBid.outcome!, rank: 1, lossReason: null, remainingBudgetCents: 10_000 } }
    stubApi({ detail: { ...review, status: 'closed', bid: won } })
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('.badge').text()).toBe('Won · Rank #1')
    expect(wrapper.text()).toContain('You’re a Winner: make one Post for $60.00.')
    expect(wrapper.find('.loss').exists()).toBe(false)
  })
})
