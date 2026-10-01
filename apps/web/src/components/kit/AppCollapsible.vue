<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import IconChevronDown from '~icons/lucide/chevron-down'

defineProps<{ title: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <CollapsibleRoot v-model:open="open">
    <CollapsibleTrigger class="trigger">
      <span>{{ title }}</span>
      <slot name="summary" />
      <IconChevronDown class="chevron" aria-hidden="true" />
    </CollapsibleTrigger>
    <CollapsibleContent class="content">
      <div class="body">
        <slot />
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>

<style scoped>
.trigger {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  inline-size: 100%;
  padding: var(--space-xs) 0;
  border: 0;
  background-color: transparent;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  text-align: start;
  cursor: pointer;
}

.trigger:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.chevron {
  margin-inline-start: auto;
  color: var(--color-text-secondary);
}

.trigger[data-state='open'] .chevron {
  rotate: 180deg;
}

.content {
  overflow: hidden;
}

.body {
  padding-block: var(--space-xs);
}

@media (prefers-reduced-motion: no-preference) {
  .chevron {
    transition: rotate var(--duration-fast) var(--ease-out);
  }

  .content[data-state='open'] {
    animation: expand var(--duration-normal) var(--ease-out);
  }

  .content[data-state='closed'] {
    animation: collapse var(--duration-fast) var(--ease-out);
  }
}

@keyframes expand {
  from {
    block-size: 0;
  }
  to {
    block-size: var(--reka-collapsible-content-height);
  }
}

@keyframes collapse {
  from {
    block-size: var(--reka-collapsible-content-height);
  }
  to {
    block-size: 0;
  }
}
</style>
