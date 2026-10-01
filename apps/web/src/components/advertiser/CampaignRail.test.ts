import type { AdvertiserCampaignSummary } from '@wepush/contracts'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import router from '@/router'
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'
import CampaignRail from './CampaignRail.vue'

const ADVERTISER_ID = '01900000-0000-7000-8000-0000000000a1'

function summary(n: number, overrides: Partial<AdvertiserCampaignSummary>): AdvertiserCampaignSummary {
  return {
    id: `01900000-0000-7000-8000-00000000000${n}`,
    title: `Campaign ${n}`,
    platform: 'tiktok',
    status: 'open',
    budgetCents: 15_000,
    biddingDeadline: '2026-01-05T12:00:00.000Z',
    bidCount: 0,
    spentCents: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const items = [
  summary(1, { title: 'Snack launch', bidCount: 3 }),
  summary(2, { title: 'Gym promo', platform: 'instagram', biddingDeadline: '2026-01-01T18:00:00.000Z', bidCount: 1 }),
  summary(3, { title: 'Old promo', status: 'closed', spentCents: 13_050 }),
]

async function mountRail(selected: string) {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ items })))
  setActivePinia(createPinia())
  await router.push(`/advertisers/${ADVERTISER_ID}/campaigns/${selected}`)
  await useAdvertiserCampaignsStore().reload()
  const wrapper = mount(CampaignRail, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('advertiser campaign rail', () => {
  it('shows one row per Campaign: platform, title, state and Bid count or Spent / Budget', async () => {
    const wrapper = await mountRail(items[0]!.id)

    const rows = wrapper.findAll('.item')
    expect(rows.map(r => r.get('svg[role="img"]').attributes('aria-label'))).toEqual(['TikTok', 'Instagram', 'TikTok'])
    expect(rows.map(r => r.get('.title').text())).toEqual(['Snack launch', 'Gym promo', 'Old promo'])
    expect(rows.map(r => r.find('.badge').exists() ? r.get('.badge').text() : null)).toEqual(['Open: 4d left', 'Closing soon: 6h left', null])
    expect(rows[1]!.get('.badge').attributes('data-tone')).toBe('warning')
    expect(rows.map(r => r.get('.meta').text())).toEqual(['3 Bids', '1 Bid', 'Spent $131 / $150'])
  })

  it('marks the selected Campaign', async () => {
    const wrapper = await mountRail(items[1]!.id)

    const active = wrapper.findAll('.item').filter(r => r.classes('router-link-active'))
    expect(active.map(r => r.get('.title').text())).toEqual(['Gym promo'])
    expect(active[0]!.attributes('aria-current')).toBe('page')
  })
})
