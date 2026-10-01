<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

// Brings its own TooltipProvider, so it works wherever it's mounted
defineProps<{ content: string }>()
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent class="tooltip" :side-offset="6" :collision-padding="8">
          {{ content }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style scoped>
/* max-content + a cap: Reka's popper wrapper is min-width: max-content, so cap the box itself */
.tooltip {
  z-index: var(--z-toast);
  box-sizing: border-box;
  inline-size: max-content;
  max-inline-size: min(16rem, 100vw - 2rem);
  padding: var(--space-2xs) var(--space-xs);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface-raised);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  text-wrap: pretty;
  box-shadow: var(--shadow-md);
}

@media (prefers-reduced-motion: no-preference) {
  .tooltip[data-state$='open'] {
    animation: fade-in var(--duration-fast) var(--ease-out);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    scale: 0.97;
  }
}
</style>
