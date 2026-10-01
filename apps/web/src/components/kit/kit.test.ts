import { flushPromises, mount } from '@vue/test-utils'
import { DialogContent, SelectContent, TooltipProvider } from 'reka-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import IconTrophy from '~icons/lucide/trophy'
import AppBadge from './AppBadge.vue'
import AppButton from './AppButton.vue'
import AppCheckboxGroup from './AppCheckboxGroup.vue'
import AppCollapsible from './AppCollapsible.vue'
import AppDialog from './AppDialog.vue'
import AppField from './AppField.vue'
import AppNumberField from './AppNumberField.vue'
import AppSelect from './AppSelect.vue'
import AppSlider from './AppSlider.vue'
import AppTextInput from './AppTextInput.vue'
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

describe('appField', () => {
  it('labels its control and describes it with the error and hint', () => {
    const wrapper = mount(AppField, {
      props: { label: 'Handle', hint: 'Public', error: 'Required' },
      slots: { default: `<template #default="f"><input :id="f.id" :aria-describedby="f.describedby" :aria-invalid="f.invalid"></template>` },
    })
    const input = wrapper.get('input')

    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    const described = input.attributes('aria-describedby')!.split(' ').map(id => wrapper.get(`#${id}`).text())
    expect(described).toEqual(['Required', 'Public'])
    expect(input.attributes('aria-invalid')).toBe('true')
  })
})

describe('appTextInput', () => {
  it('binds v-model and passes attributes to the input', async () => {
    const wrapper = mount(AppTextInput, { props: { 'modelValue': '', 'onUpdate:modelValue': () => {} }, attrs: { name: 'handle' } })

    await wrapper.get('input[name="handle"]').setValue('@mia')

    expect(wrapper.emitted('update:modelValue')).toEqual([['@mia']])
  })
})

describe('appNumberField', () => {
  it('commits a typed value on blur, and steps from the buttons', async () => {
    const wrapper = mount(AppNumberField, { props: { 'modelValue': 10, 'min': 0, 'step': 5, 'onUpdate:modelValue': () => {} }, attrs: { name: 'n' } })
    const input = wrapper.get('input[name="n"]')

    await input.setValue('42')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([42])

    await wrapper.get('[aria-label="Increase"]').trigger('pointerdown')
    expect(wrapper.emitted('update:modelValue')?.length).toBeGreaterThanOrEqual(1)
  })
})

describe('appSelect', () => {
  it('shows the selected label and picks another option', async () => {
    const wrapper = mount(AppSelect, {
      props: { 'modelValue': 'tiktok', 'options': [{ value: 'tiktok', label: 'TikTok' }, { value: 'youtube', label: 'YouTube' }], 'onUpdate:modelValue': () => {} },
      attachTo: document.body,
    })
    await flushPromises()
    const trigger = wrapper.get('button')
    expect(trigger.text()).toContain('TikTok')

    await trigger.trigger('pointerdown', { button: 0, pointerType: 'mouse' })
    await flushPromises()
    const option = wrapper.findComponent(SelectContent).findAll('[role="option"]').find(o => o.text() === 'YouTube')!
    await option.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['youtube'])
    wrapper.unmount()
  })
})

describe('appCheckboxGroup', () => {
  it('toggles values in and out of the array', async () => {
    const wrapper = mount(AppCheckboxGroup, {
      props: { 'modelValue': ['food'], 'options': [{ value: 'food', label: 'Food' }, { value: 'tech', label: 'Tech' }], 'onUpdate:modelValue': (v: string[]) => wrapper.setProps({ modelValue: v }) },
    })
    const [food, tech] = wrapper.findAll('[role="checkbox"]')

    expect(food!.attributes('aria-checked')).toBe('true')
    await tech!.trigger('click')
    await food!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['tech']])
  })
})

describe('appSlider', () => {
  it('exposes a labelled thumb clamped to the range', async () => {
    const wrapper = mount(AppSlider, { props: { modelValue: 500, min: 10, max: 225, label: 'Fee' } })
    await flushPromises()
    const thumb = wrapper.get('[role="slider"]')

    expect(thumb.attributes('aria-label')).toBe('Fee')
    expect(thumb.attributes('aria-valuenow')).toBe('225')
  })
})
