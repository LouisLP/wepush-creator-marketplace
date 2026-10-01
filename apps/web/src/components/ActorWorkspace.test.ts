import { flushPromises, mount } from '@vue/test-utils'
import { listAdvertiserCampaigns } from '@wepush/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { call, rejectedActorId } from '@/api'
import router from '@/router'
import ActorWorkspace from './ActorWorkspace.vue'

const A1 = '01900000-0000-7000-8000-0000000000a1'
const C1 = '01900000-0000-7000-8000-0000000000c1'

async function mountAt(path: string) {
  await router.push(path)
  const wrapper = mount(ActorWorkspace, { global: { plugins: [router], stubs: { RouterView: true } } })
  await flushPromises()
  return wrapper
}

function crumbs(wrapper: Awaited<ReturnType<typeof mountAt>>) {
  return wrapper.findAll('nav[aria-label="Breadcrumb"] li').map(li => li.text())
}

afterEach(() => {
  vi.unstubAllGlobals()
  rejectedActorId.value = undefined
})

describe('actor workspace', () => {
  it('breadcrumbs the hub, the acting Advertiser and the Campaign', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ items: [{ id: A1, name: 'Glow Cosmetics', createdAt: '2026-01-01T00:00:00.000Z' }] })))
    const wrapper = await mountAt(`/advertisers/${A1}/campaigns/new`)

    expect(crumbs(wrapper)).toEqual(['Advertisers', 'Glow Cosmetics', 'New Campaign'])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('New Campaign')
    expect(wrapper.findAll('nav a').map(a => a.attributes('href'))).toEqual(['/advertisers', `/advertisers/${A1}`])
  })

  it('ends the breadcrumb on the Creator at their workspace root', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ items: [{ id: C1, handle: '@mia.cooks' }] })))
    const wrapper = await mountAt(`/creators/${C1}`)

    expect(crumbs(wrapper)).toEqual(['Creators', '@mia.cooks'])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('@mia.cooks')
  })

  it('shows not-found with a way back once the API rejects the actor', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url === '/api/advertisers'
      ? Response.json({ items: [] })
      : Response.json({ type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Unknown actor', code: 'unknown_actor', requestId: 'r1' }, { status: 401 })))
    const wrapper = await mountAt(`/advertisers/${A1}`)

    await call(listAdvertiserCampaigns).catch(() => {})
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Advertiser not found')
    expect(wrapper.get('a.btn').attributes('href')).toBe('/advertisers')
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(false)
  })
})
