<script setup lang="ts" generic="T extends string">
import { SelectContent, SelectIcon, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'
import IconCheck from '~icons/lucide/check'
import IconChevronDown from '~icons/lucide/chevron-down'

defineOptions({ inheritAttrs: false })
defineProps<{
  options: readonly { value: T, label: string }[]
  placeholder?: string
}>()
const model = defineModel<T>()
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger class="control trigger" v-bind="$attrs">
      <SelectValue :placeholder="placeholder" class="value" />
      <SelectIcon class="chevron">
        <IconChevronDown aria-hidden="true" />
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="app-select-content" position="popper" :side-offset="4">
        <SelectViewport class="app-select-viewport">
          <SelectItem v-for="o in options" :key="o.value" :value="o.value" class="app-select-item">
            <SelectItemText>{{ o.label }}</SelectItemText>
            <SelectItemIndicator class="app-select-check">
              <IconCheck aria-hidden="true" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style scoped>
.trigger {
  justify-content: space-between;
  gap: var(--space-xs);
  text-align: start;
  cursor: pointer;
}

.value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger[data-placeholder] .value {
  color: var(--color-text-muted);
}

.chevron {
  flex: none;
  color: var(--color-text-muted);
}
</style>

<!-- Unscoped: SelectContent swaps its root, so scoped attrs don't reliably reach the teleported popup -->
<style>
/* Above dialogs: selects open inside the create dialogs */
.app-select-content {
  z-index: var(--z-toast);
  inline-size: var(--reka-select-trigger-width);
  max-block-size: var(--reka-select-content-available-height);
  overflow: hidden;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface-raised);
  box-shadow: var(--shadow-md);
}

.app-select-viewport {
  padding: var(--space-2xs);
}

.app-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  user-select: none;
}

.app-select-item[data-highlighted] {
  outline: none;
  background-color: var(--color-bg-surface-hover);
}

.app-select-item[data-state='checked'] {
  font-weight: var(--font-weight-semibold);
}

.app-select-check {
  display: grid;
  color: var(--color-accent-subtle-fg);
}

@media (prefers-reduced-motion: no-preference) {
  .app-select-content[data-state='open'] {
    animation: app-select-fade-in var(--duration-fast) var(--ease-out);
  }
}

@keyframes app-select-fade-in {
  from {
    opacity: 0;
    translate: 0 -2px;
  }
}
</style>
