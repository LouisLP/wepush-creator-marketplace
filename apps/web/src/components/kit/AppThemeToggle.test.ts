import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function mountToggle() {
  vi.resetModules()
  const { default: AppThemeToggle } = await import('./AppThemeToggle.vue')
  return mount(AppThemeToggle)
}

describe('appThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })
  afterEach(() => vi.unstubAllGlobals())

  it('starts from the theme applied before paint', async () => {
    document.documentElement.dataset.theme = 'light'
    const wrapper = await mountToggle()

    expect(wrapper.attributes('aria-label')).toBe('Switch to dark theme')
  })

  it('falls back to the OS preference', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-color-scheme: light)' }))
    const wrapper = await mountToggle()

    expect(wrapper.attributes('aria-label')).toBe('Switch to dark theme')
  })

  it('toggles the document theme and persists only on toggle', async () => {
    document.documentElement.dataset.theme = 'dark'
    const wrapper = await mountToggle()
    expect(localStorage.getItem('wepush.theme')).toBeNull()

    await wrapper.trigger('click')

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('wepush.theme')).toBe('light')
    expect(wrapper.attributes('aria-label')).toBe('Switch to dark theme')

    await wrapper.trigger('click')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('wepush.theme')).toBe('dark')
  })
})
