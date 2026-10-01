import { flushPromises, mount } from '@vue/test-utils'
import { DialogContent, TooltipProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import IconTrophy from '~icons/lucide/trophy'
import AppBadge from './AppBadge.vue'
import AppButton from './AppButton.vue'
import AppCollapsible from './AppCollapsible.vue'
import AppDialog from './AppDialog.vue'
import AppTooltip from './AppTooltip.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('appButton', () => {
  it('renders a non-submitting button with the variant class', () => {
    const wrapper = mount(AppButton, { props: { variant: 'secondary' }, slots: { default: 'Save' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toEqual(['btn', 'btn-secondary'])
  })

  it('renders as another element without a type', () => {
    const wrapper = mount(AppButton, { props: { as: 'a', variant: 'ghost' }, attrs: { href: '/x' }, slots: { default: 'Go' } })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.classes()).toContain('btn-ghost')
  })
})

describe('appBadge', () => {
  it('defaults to a neutral subtle pill', () => {
    const wrapper = mount(AppBadge, { slots: { default: 'TikTok' } })

    expect(wrapper.attributes()).toMatchObject({ 'data-tone': 'neutral', 'data-variant': 'subtle' })
    expect(wrapper.text()).toBe('TikTok')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('renders a decorative leading icon alongside the label', () => {
    const wrapper = mount(AppBadge, { props: { tone: 'success', variant: 'outline', icon: IconTrophy }, slots: { default: 'Would win' } })

    expect(wrapper.attributes()).toMatchObject({ 'data-tone': 'success', 'data-variant': 'outline' })
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.text()).toBe('Would win')
  })
})

describe('appDialog', () => {
  function mountDialog() {
    return mount(AppDialog, {
      props: { 'title': 'New creator', 'description': 'Add a creator', 'onUpdate:open': () => {} },
      slots: {
        trigger: '<button>New</button>',
        default: `<template #default="{ close }"><input name="handle" /><button class="done" @click="close">Done</button></template>`,
      },
      attachTo: document.body,
    })
  }

  it('opens from the trigger into a labelled, portalled dialog', async () => {
    const wrapper = mountDialog()
    await wrapper.get('button').trigger('click')
    await flushPromises()

    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.getAttribute('data-state')).toBe('open')
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toContain('New creator')
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toContain('Add a creator')
    expect(wrapper.find('input').exists()).toBe(false)
    await wrapper.findComponent(DialogContent).get('input').setValue('@mia.cooks')
    wrapper.unmount()
  })

  it('closes through the slot close() and emits update:open', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ open: true })
    await flushPromises()

    await wrapper.findComponent(DialogContent).get('.done').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    wrapper.unmount()
  })

  it('closes on the labelled close button', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ open: true })
    await flushPromises()

    await wrapper.findComponent(DialogContent).get('[aria-label="Close"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    wrapper.unmount()
  })
})

describe('appCollapsible', () => {
  it('toggles its content from the trigger', async () => {
    const wrapper = mount(AppCollapsible, { props: { title: 'Requirements' }, slots: { default: '<p>Min followers</p>' } })
    const trigger = wrapper.get('button')

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).not.toContain('Min followers')

    await trigger.trigger('click')

    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(trigger.text()).toContain('Requirements')
    expect(wrapper.text()).toContain('Min followers')
  })

  it('can start open', () => {
    const wrapper = mount(AppCollapsible, { props: { title: 'Bids', open: true }, slots: { default: 'Bid list' } })

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Bid list')
  })
})

describe('appTooltip', () => {
  it('shows its content on focus', async () => {
    const Host = defineComponent(() => () => h(TooltipProvider, { delayDuration: 0 }, () =>
      h(AppTooltip, { content: 'TikTok' }, () => h('button', { 'aria-label': 'TikTok' }, 'T'))))
    const wrapper = mount(Host, { attachTo: document.body })

    await wrapper.get('button').trigger('focus')
    await flushPromises()

    expect(document.body.querySelector('[role="tooltip"]')?.textContent?.trim()).toBe('TikTok')
    wrapper.unmount()
  })
})
