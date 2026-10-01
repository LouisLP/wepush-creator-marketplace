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
      <SelectContent class="content" position="popper" :side-offset="4">
        <SelectViewport class="viewport">
          <SelectItem v-for="o in options" :key="o.value" :value="o.value" class="item">
            <SelectItemText>{{ o.label }}</SelectItemText>
            <SelectItemIndicator class="check">
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

/* Above dialogs: selects open inside the create dialogs */
.content {
  z-index: var(--z-toast);
  inline-size: var(--reka-select-trigger-width);
  max-block-size: var(--reka-select-content-available-height);
  overflow: hidden;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface-raised);
  box-shadow: var(--shadow-md);
}

.viewport {
  padding: var(--space-2xs);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  user-select: none;
}

.item[data-highlighted] {
  outline: none;
  background-color: var(--color-bg-surface-hover);
}

.item[data-state='checked'] {
  font-weight: var(--font-weight-semibold);
}

.check {
  display: grid;
  color: var(--color-accent-subtle-fg);
}

@media (prefers-reduced-motion: no-preference) {
  .content[data-state='open'] {
    animation: fade-in var(--duration-fast) var(--ease-out);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    translate: 0 -2px;
  }
}
</style>
