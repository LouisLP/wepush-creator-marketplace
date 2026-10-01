import type { CreatorBid, CreatorCampaign, MatchedCampaign, MyBid } from '@wepush/contracts'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { TooltipProvider } from 'reka-ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
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
  const host = () => h(TooltipProvider, () => h(component, props))
  return mount(host, { global: { plugins: [pinia, router], stubs: { RouterView: true } } })
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
  it('shows one-line Matched rows: title and Relevance chip, linking to the Campaign', async () => {
    stubApi()
    const wrapper = await mountWith(CreatorWorkspace)
    await flushPromises()

    const item = wrapper.get('nav[aria-labelledby="matched-heading"] li')
    expect(item.get('.rail-title').text()).toBe('Snack launch')
    expect(item.get('.badge').text()).toBe('Relevance75')
    expect(item.text()).not.toContain('suggested')
    expect(item.get('a').attributes('href')).toBe(`/creators/${CREATOR_ID}/campaigns/${ID}`)
  })

  it('lists My Bids with title and an icon-only status named for screen readers', async () => {
    stubApi()
    const wrapper = await mountWith(CreatorWorkspace)
    await flushPromises()

    const items = wrapper.findAll('nav[aria-labelledby="my-bids-heading"] li')
    expect(items.map(li => li.get('.status').attributes('data-status'))).toEqual(['lost', 'pending'])
    expect(items.map(li => li.get('.status .visually-hidden').text())).toEqual(['Lost · Rank #2', 'Pending'])
    expect(items[0]!.get('.status svg').attributes('aria-hidden')).toBe('true')
    expect(items[0]!.get('.rail-title').text()).toBe('Snack launch')
    expect(items[0]!.get('a').attributes('href')).toBe(`/creators/${CREATOR_ID}/campaigns/${ID}`)
  })

  it('marks the open Campaign’s row as the current page', async () => {
    stubApi()
    const wrapper = await mountWith(CreatorWorkspace)
    await router.push(`/creators/${CREATOR_ID}/campaigns/${ID}`)
    await flushPromises()

    expect(wrapper.get('nav[aria-labelledby="matched-heading"] a').attributes('aria-current')).toBe('page')
    expect(wrapper.findAll('nav[aria-labelledby="my-bids-heading"] a').map(a => a.attributes('aria-current'))).toEqual(['page', undefined])
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
    expect(wrapper.findAll('nav[aria-labelledby="my-bids-heading"] li')[1]!.text()).toContain('Lost · Rank #3')
    wrapper.unmount()
  })
})

describe('campaign review pane', () => {
  it('heads the page with advertiser, state and platform badges, and step dots naming only the current step', async () => {
    stubApi()
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Snack launch')
    expect(wrapper.get('.meta').text()).toContain('Glow Cosmetics')
    expect(wrapper.findAll('.meta .badge').map(b => b.text())).toEqual(['3d left', 'TikTok'])
    expect(wrapper.findAll('.steps li')).toHaveLength(4)
    expect(wrapper.get('[aria-current="step"]').text()).toBe('Review')
    expect(wrapper.findAll('.steps li:not([aria-current]) .visually-hidden').map(s => s.text())).toEqual(['Bid', 'Track', 'Outcome'])
  })

  it('shows the fit row: Relevance chip and a ✓/✗ chip per Requirement', async () => {
    const fetch = stubApi()
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(`/api/creator/campaigns/${ID}`, expect.anything())
    expect(wrapper.get('.fit .relevance').text()).toBe('Relevance 75')
    const checks = wrapper.findAll('.checks li')
    expect(checks.map(li => li.classes())).toEqual([['pass'], ['pass'], ['miss'], ['pass']])
    expect(checks[2]!.text()).toContain('At least 60K followers')
    expect(checks[2]!.get('.visually-hidden').text()).toBe('Not met:')
  })

  it('collapses Brief (with a one-line preview), Why this Relevance and Terms', async () => {
    stubApi()
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    const triggers = wrapper.findAll('.disclosure button')
    expect(triggers.map(t => t.attributes('aria-expanded'))).toEqual(['false', 'false', 'false'])
    expect(triggers.map(t => t.text())).toEqual(['BriefShow the snack.', 'Why this Relevance75', 'Terms$1,000.00 · $10.00 CPM'])
    expect(wrapper.findAll('meter')).toHaveLength(0)

    await triggers[1]!.trigger('click')
    expect(wrapper.findAll('meter')).toHaveLength(2)
    await triggers[2]!.trigger('click')
    expect(wrapper.text()).toContain('Target CPM$10.00')
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

  it('shows the quote line and pre-fills the Suggested Fee with a live CPM-vs-Target chip', async () => {
    const { wrapper, fee } = await mountComposer()

    expect(wrapper.findAll('.quote > span').map(s => s.text())).toEqual(['7.5K Est. Impressions', 'Suggested $75.00', 'Range $10.00 – $225.00'])
    expect((fee.element as HTMLInputElement).value).toBe('75')
    expect(wrapper.get('.cpm').text()).toContain('Effective CPM $10.00')
    expect(wrapper.get('.cpm .badge').text()).toBe('at target')

    await fee.setValue('60')
    expect(wrapper.get('.cpm').text()).toContain('Effective CPM $8.00')
    expect(wrapper.get('.cpm .badge').text()).toBe('20% under target')
    expect(wrapper.get('.cpm .badge').attributes('data-tone')).toBe('success')

    await fee.setValue('150')
    expect(wrapper.get('.cpm .badge').text()).toBe('100% over target')
    expect(wrapper.get('.cpm .badge').attributes('data-tone')).toBe('warning')
  })

  it('keeps the bid rules behind a labelled info button', async () => {
    const { wrapper } = await mountComposer()

    const info = wrapper.get('button[aria-label="Bid rules"]')
    const rules = wrapper.get(`#${info.attributes('aria-describedby')}`)
    expect(rules.text()).toContain('Bids are final and sealed')
    expect(rules.classes()).toContain('visually-hidden')
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
    expect(wrapper.get('h2').text()).toBe('Your Bid')
    expect(wrapper.get('.status').text()).toBe('Pending')
    expect(wrapper.get('[aria-current="step"]').text()).toBe('Track')
    expect(wrapper.get('.facts').text()).toContain('Effective CPM $8.00')
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
  it('shows a Pending Bid with Fee, the CPM-vs-Target chip and when Winners are picked', async () => {
    stubApi({ detail: { ...review, bid: pendingBid } })
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('[aria-current="step"]').text()).toBe('Track')
    expect(wrapper.find('form').exists()).toBe(false)
    const facts = wrapper.get('.facts')
    expect(facts.text()).toContain('Your Fee $60.00')
    expect(facts.text()).toContain('Effective CPM $8.00 vs $10.00')
    expect(facts.get('.badge').text()).toBe('20% under target')
    expect(facts.text()).not.toContain('Rank')
    expect(wrapper.get('.action').text()).toContain('3d left')
  })

  it('shows a Lost outcome with Rank, Score, a one-line Loss Reason and Score factors collapsed', async () => {
    stubApi({ detail: { ...review, status: 'closed', bid: lostBid } })
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('[aria-current="step"]').text()).toBe('Outcome')
    expect(wrapper.findAll('.meta .badge').map(b => b.text())).toEqual(['Closed', 'TikTok'])
    expect(wrapper.get('.action .status').text()).toBe('Lost · Rank #2')
    expect(wrapper.get('.facts').text()).toContain('Rank #2')
    expect(wrapper.get('.facts').text()).toContain('Score 52.5')
    expect(wrapper.get('.loss').text()).toBe('Fee didn’t fit the Remaining Budget: $40.00 left when your Bid was reached.')

    const why = wrapper.findAll('.disclosure button')[1]!
    expect(why.text()).toBe('Why this Score52.5')
    await why.trigger('click')
    expect(wrapper.findAll('meter')).toHaveLength(2)
    expect(wrapper.text()).toContain('Scoring Version v1')
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

    expect(wrapper.get('.action .status').text()).toBe('Lost · Rank #2')
    wrapper.unmount()
  })

  it('shows a Won outcome', async () => {
    const won: CreatorBid = { ...lostBid, status: 'won', outcome: { ...lostBid.outcome!, rank: 1, lossReason: null, remainingBudgetCents: 10_000 } }
    stubApi({ detail: { ...review, status: 'closed', bid: won } })
    const wrapper = await mountWith(CampaignReviewPage, { id: ID })
    await flushPromises()

    expect(wrapper.get('.action .status').text()).toBe('Won · Rank #1')
    expect(wrapper.text()).toContain('You’re a Winner: make one Post for $60.00.')
    expect(wrapper.find('.loss').exists()).toBe(false)
  })
})
