import { flushPromises, mount } from '@vue/test-utils'
import { DialogContent } from 'reka-ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import router from '@/router'
import AdvertiserHubPage from './advertiser/AdvertiserHubPage.vue'
import CreatorHubPage from './creator/CreatorHubPage.vue'

const A1 = '01900000-0000-7000-8000-0000000000a1'
const C1 = '01900000-0000-7000-8000-0000000000c1'
const NEW_ID = '01900000-0000-7000-8000-0000000000f1'

const advertiser = { id: A1, name: 'Glow Cosmetics', createdAt: '2026-01-01T00:00:00.000Z' }
const creator = { id: C1, handle: '@mia.cooks', platform: 'tiktok', category: 'food', followers: 120_000, engagementRate: 0.064, createdAt: '2026-01-01T00:00:00.000Z' }

function stubApi(lists: Record<string, unknown[]>, created?: object) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => init?.method === 'POST'
    ? Response.json(created, { status: 201 })
    : Response.json({ items: lists[url] ?? [] }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

async function mountPage(page: object, path: string) {
  await router.push(path)
  const wrapper = mount(page, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('advertiser hub', () => {
  it('lists Advertisers as links into their workspace', async () => {
    stubApi({ '/api/advertisers': [advertiser] })
    const wrapper = await mountPage(AdvertiserHubPage, '/advertisers')

    expect(wrapper.get('h1').text()).toBe('Advertisers')
    const row = wrapper.get('ul a')
    expect(row.text()).toBe('Glow Cosmetics')
    expect(row.attributes('href')).toBe(`/advertisers/${A1}`)
    wrapper.unmount()
  })

  it('shows an empty state', async () => {
    stubApi({})
    const wrapper = await mountPage(AdvertiserHubPage, '/advertisers')

    expect(wrapper.text()).toContain('No Advertisers yet.')
    wrapper.unmount()
  })

  it('creates an Advertiser in a dialog and lands on it', async () => {
    const fetch = stubApi({ '/api/advertisers': [advertiser] }, { ...advertiser, id: NEW_ID, name: 'Acme Co' })
    const wrapper = await mountPage(AdvertiserHubPage, '/advertisers')

    await wrapper.findAll('button').find(b => b.text() === 'New Advertiser')!.trigger('click')
    await flushPromises()
    const dialog = wrapper.findComponent(DialogContent)
    await dialog.get('input[name="name"]').setValue('Acme Co')
    await dialog.get('form').trigger('submit')
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith('/api/advertisers', expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Acme Co' }) }))
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe(`/advertisers/${NEW_ID}`))
    wrapper.unmount()
  })
})

describe('creator hub', () => {
  it('lists Creators with Platform and Category badges', async () => {
    stubApi({ '/api/creators': [creator] })
    const wrapper = await mountPage(CreatorHubPage, '/creators')

    const row = wrapper.get('ul a')
    expect(row.attributes('href')).toBe(`/creators/${C1}`)
    expect(row.findAll('.badge').map(b => b.text())).toEqual(['TikTok', 'Food'])
    expect(row.text()).toContain('120K followers')
    wrapper.unmount()
  })

  it('creates a Creator in a dialog and lands on it', async () => {
    stubApi({ '/api/creators': [] }, { ...creator, id: NEW_ID, handle: '@new.one' })
    const wrapper = await mountPage(CreatorHubPage, '/creators')

    await wrapper.findAll('button').find(b => b.text() === 'New Creator')!.trigger('click')
    await flushPromises()
    const dialog = wrapper.findComponent(DialogContent)
    await dialog.get('input[name="handle"]').setValue('@new.one')
    await dialog.get('form').trigger('submit')
    await flushPromises()

    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe(`/creators/${NEW_ID}`))
    wrapper.unmount()
  })
})
