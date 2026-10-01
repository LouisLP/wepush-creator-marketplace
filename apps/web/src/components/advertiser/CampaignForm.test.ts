import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CampaignForm from './CampaignForm.vue'

const matching = {
  matchingCreators: 3,
  suggestedFees: { minCents: 3_000, medianCents: 7_500, maxCents: 15_000 },
  postsAtMedian: 13,
  cpmRangeCents: { low: 300, high: 1_500 },
}
const noneMatching = { matchingCreators: 0, suggestedFees: null, postsAtMedian: null, cpmRangeCents: { low: 300, high: 1_500 } }

type Handler = (body: Record<string, unknown>) => Response
let routes: Record<string, Handler>
let fetchMock: ReturnType<typeof vi.fn>

function mountForm() {
  fetchMock = vi.fn(async (url: string, init: RequestInit) => routes[url]!(JSON.parse(String(init.body))))
  vi.stubGlobal('fetch', fetchMock)
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(CampaignForm, { global: { plugins: [pinia] } })
}

async function settle() {
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
}

async function check(wrapper: ReturnType<typeof mount>, label: string) {
  const box = wrapper.findAll('[role="checkbox"]').find(b => b.element.parentElement!.textContent!.trim() === label)!
  await box.trigger('click')
}

// The number fields commit on blur, like a person tabbing out
async function typeNumber(wrapper: ReturnType<typeof mount>, name: string, value: number) {
  const input = wrapper.get(`input[name="${name}"]`)
  await input.setValue(String(value))
  await input.trigger('blur')
}

const callsTo = (url: string) => fetchMock.mock.calls.filter(([u]) => u === url)

describe('campaignForm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    routes = {
      '/api/advertiser/campaigns/preview': body => Response.json((body.minFollowers as number) > 1_000_000 ? noneMatching : matching),
    }
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('previews once the terms are valid, debounced, and updates as Requirements change', async () => {
    const wrapper = mountForm()
    await settle()
    expect(callsTo('/api/advertiser/campaigns/preview')).toHaveLength(0)
    expect(wrapper.text()).toContain('Fix the Requirements')

    await check(wrapper, 'Food')
    await check(wrapper, 'Tech')
    await settle()

    expect(callsTo('/api/advertiser/campaigns/preview')).toHaveLength(1)
    expect(wrapper.text()).toContain('3 Creators match')
    expect(wrapper.text()).toContain('$30.00 – $150.00')
    expect(wrapper.text()).toContain('≈ 13 Posts at the median')

    await typeNumber(wrapper, 'minFollowers', 2_000_000)
    await settle()

    expect(wrapper.text()).toContain('No Creators match these Requirements')
  })

  it('shows client-side errors per field without calling create', async () => {
    const wrapper = mountForm()

    await typeNumber(wrapper, 'budget', 5)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Pick at least one category')
    expect(wrapper.text()).toContain('Must be at least $10')
    expect(callsTo('/api/advertiser/campaigns')).toHaveLength(0)
  })

  it('puts server errors on their field and emits the created Campaign', async () => {
    let reply: Response = Response.json(
      { type: 'about:blank', title: 'Unprocessable Entity', status: 422, detail: 'x', code: 'deadline_out_of_range', requestId: 'r1', earliest: '2026-01-01T12:05:00.000Z', latest: '2026-01-31T12:00:00.000Z' },
      { status: 422 },
    )
    routes['/api/advertiser/campaigns'] = () => reply
    const wrapper = mountForm()
    await wrapper.find('input[name="title"]').setValue('Taco Tuesday')
    await wrapper.find('textarea[name="brief"]').setValue('Film our taco.')
    await check(wrapper, 'Food')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const deadlineField = wrapper.find('input[name="biddingDeadline"]').element.parentElement!
    expect(deadlineField.textContent).toContain('Pick a deadline between')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    const created = { id: 'c1', title: 'Taco Tuesday' }
    reply = Response.json(created, { status: 201 })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('created')).toEqual([[created]])
    expect(callsTo('/api/advertiser/campaigns')[1]![1].body).toContain('"categories":["food"]')
  })
})
