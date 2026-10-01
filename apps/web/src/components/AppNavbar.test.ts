import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import router from '@/router'
import AppNavbar from './AppNavbar.vue'

async function mountAt(path: string) {
  await router.push(path)
  return mount(AppNavbar, { global: { plugins: [router] } })
}

function hubLink(wrapper: Awaited<ReturnType<typeof mountAt>>, label: string) {
  return wrapper.findAll('a').find(a => a.text() === label)!
}

describe('app navbar', () => {
  it('links the logo home, both hubs, and offers the theme toggle', async () => {
    const wrapper = await mountAt('/advertisers')

    expect(wrapper.get('img[alt="WePush"]').element.closest('a')!.getAttribute('href')).toBe('/')
    expect(hubLink(wrapper, 'Advertisers').attributes('href')).toBe('/advertisers')
    expect(hubLink(wrapper, 'Creators').attributes('href')).toBe('/creators')
    expect(wrapper.find('button[aria-label^="Switch to"]').exists()).toBe(true)
  })

  it('marks the hub index as the current page', async () => {
    const wrapper = await mountAt('/creators')

    expect(hubLink(wrapper, 'Creators').attributes('aria-current')).toBe('page')
    expect(hubLink(wrapper, 'Advertisers').attributes('aria-current')).toBeUndefined()
  })

  it('keeps the hub current inside one of its workspaces', async () => {
    const wrapper = await mountAt('/advertisers/01900000-0000-7000-8000-0000000000a1/campaigns/new')

    expect(hubLink(wrapper, 'Advertisers').attributes('aria-current')).toBe('true')
    expect(hubLink(wrapper, 'Creators').attributes('aria-current')).toBeUndefined()
  })
})

describe('routing', () => {
  it.each(['/', '/nowhere', '/advertiser'])('sends %s to the Advertiser hub', async (path) => {
    await router.push(path)

    expect(router.currentRoute.value.fullPath).toBe('/advertisers')
  })
})
