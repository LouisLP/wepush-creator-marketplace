<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import IconX from '~icons/lucide/x'

defineProps<{ title: string, description: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent class="content">
        <DialogTitle class="title">
          {{ title }}
        </DialogTitle>
        <DialogDescription class="desc">
          {{ description }}
        </DialogDescription>
        <slot :close="() => (open = false)" />
        <DialogClose class="close" aria-label="Close">
          <IconX aria-hidden="true" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background-color: var(--color-bg-scrim);
}

.content {
  position: fixed;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  z-index: var(--z-modal);
  display: grid;
  gap: var(--space-md);
  inline-size: min(32rem, 100vw - 2 * var(--space-gutter));
  max-block-size: calc(100dvh - 2 * var(--space-gutter));
  overflow-y: auto;
  padding: var(--space-lg);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-surface-raised);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-lg);
}

.title {
  padding-inline-end: var(--space-xl);
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
}

.desc {
  margin-block-start: calc(-1 * var(--space-sm));
  color: var(--color-text-secondary);
}

.close {
  position: absolute;
  inset-block-start: var(--space-sm);
  inset-inline-end: var(--space-sm);
  display: inline-grid;
  place-items: center;
  padding: var(--space-2xs);
  border: 0;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  cursor: pointer;
}

.close:hover {
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.content:focus-visible,
.close:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

@media (prefers-reduced-motion: no-preference) {
  .overlay[data-state='open'],
  .content[data-state='open'] {
    animation: fade-in var(--duration-normal) var(--ease-out);
  }

  .overlay[data-state='closed'],
  .content[data-state='closed'] {
    animation: fade-out var(--duration-fast) var(--ease-out);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes fade-out {
  to {
    opacity: 0;
  }
}
</style>
