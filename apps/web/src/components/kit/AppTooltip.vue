<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

defineProps<{ content: string }>()
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent class="tooltip" :side-offset="6">
        {{ content }}
        <TooltipArrow class="arrow" />
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>

<style scoped>
.tooltip {
  z-index: var(--z-toast);
  max-inline-size: 18rem;
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-inverse);
  color: var(--color-text-on-inverse);
  font-size: var(--font-size-xs);
  box-shadow: var(--shadow-md);
}

.arrow {
  fill: var(--color-bg-inverse);
}

@media (prefers-reduced-motion: no-preference) {
  .tooltip[data-state$='open'] {
    animation: fade-in var(--duration-fast) var(--ease-out);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}
</style>
