<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import IconCheck from '~icons/lucide/check'

defineProps<{ value?: AcceptableValue }>()
// Standalone v-model; inside AppCheckboxGroup the group owns the state
const model = defineModel<boolean | 'indeterminate'>()
</script>

<template>
  <label class="checkbox">
    <CheckboxRoot v-model="model" :value="value" class="box">
      <CheckboxIndicator class="indicator">
        <IconCheck aria-hidden="true" />
      </CheckboxIndicator>
    </CheckboxRoot>
    <slot />
  </label>
</template>

<style scoped>
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
}

.box {
  display: inline-grid;
  flex: none;
  place-items: center;
  inline-size: 1.125rem;
  block-size: 1.125rem;
  padding: 0;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-canvas);
  color: var(--color-text-on-accent);
  cursor: pointer;
}

.checkbox:hover .box:not([data-state='checked']) {
  border-color: var(--color-text-muted);
}

.box[data-state='checked'] {
  border-color: var(--color-accent-default);
  background-color: var(--color-accent-default);
}

.box:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.indicator {
  display: grid;
  font-size: var(--font-size-xs);
}
</style>
