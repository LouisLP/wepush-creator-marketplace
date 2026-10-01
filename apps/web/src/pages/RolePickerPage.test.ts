import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import router from '@/router'
import { useIdentityStore } from '@/stores/identity.ts'
import RolePickerPage from './RolePickerPage.vue'

const responses: Record<string, unknown> = {
  '/api/advertisers': { items: [{ id: 'a1', name: 'Glow Cosmetics', createdAt: '2026-01-01T00:00:00.000Z' }] },
  '/api/creators': {
    items: [{ id: 'c1', handle: '@mia.cooks', platform: 'tiktok', category: 'food', followers: 120000, engagementRate: 0.064, createdAt: '2026-01-01T00:00:00.000Z' }],
  },
}

function mountPage() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(responses[url])))
  const pinia = createPinia()
  return { wrapper: mount(RolePickerPage, { global: { plugins: [pinia, router] } }), pinia }
}

describe('rolePickerPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders advertisers and creators fetched from the API', async () => {
    const { wrapper } = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Glow Cosmetics')
    expect(wrapper.text()).toContain('@mia.cooks')
    expect(wrapper.text()).toContain('120K')
    expect(wrapper.text()).toContain('6.4%')
  })

  it('acts as the picked identity', async () => {
    const { wrapper } = mountPage()
    await flushPromises()

    await wrapper.findAll('button').find(b => b.text() === 'Glow Cosmetics')!.trigger('click')

    expect(useIdentityStore().get('advertiser')).toEqual({ id: 'a1', name: 'Glow Cosmetics' })
  })
})
