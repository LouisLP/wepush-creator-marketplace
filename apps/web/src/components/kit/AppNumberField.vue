<script setup lang="ts">
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from 'reka-ui'
import IconChevronDown from '~icons/lucide/chevron-down'
import IconChevronUp from '~icons/lucide/chevron-up'

defineOptions({ inheritAttrs: false })
const { id, min, max, step, formatOptions } = defineProps<{
  id?: string
  min?: number
  max?: number
  step?: number
  formatOptions?: Intl.NumberFormatOptions
}>()
// Commits on blur, Enter or the steppers, not on every keystroke
const model = defineModel<number | undefined>()
</script>

<template>
  <NumberFieldRoot
    :id="id"
    v-model="model"
    class="control number"
    :min="min"
    :max="max"
    :step="step"
    :step-snapping="false"
    :format-options="formatOptions"
    locale="en-US"
  >
    <NumberFieldInput class="input" v-bind="$attrs" />
    <span class="steppers">
      <NumberFieldIncrement class="step" aria-label="Increase" tabindex="-1">
        <IconChevronUp aria-hidden="true" />
      </NumberFieldIncrement>
      <NumberFieldDecrement class="step" aria-label="Decrease" tabindex="-1">
        <IconChevronDown aria-hidden="true" />
      </NumberFieldDecrement>
    </span>
  </NumberFieldRoot>
</template>

<style scoped>
.number {
  gap: var(--space-xs);
  padding-block: 0;
  padding-inline-end: var(--space-2xs);
}

.input {
  flex: 1;
  min-inline-size: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
}

.input:focus-visible {
  outline: none;
}

.steppers {
  display: grid;
}

.step {
  display: grid;
  place-items: center;
  padding: 0 var(--space-2xs);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.step:hover:not([data-disabled]) {
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.step[data-disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
