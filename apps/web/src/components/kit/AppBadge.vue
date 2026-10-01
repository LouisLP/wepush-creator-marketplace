<script setup lang="ts">
import type { Component } from 'vue'

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning'

const { tone = 'neutral', variant = 'subtle' } = defineProps<{
  tone?: BadgeTone
  variant?: 'subtle' | 'outline'
  icon?: Component
}>()
</script>

<template>
  <span class="badge" :data-tone="tone" :data-variant="variant">
    <component :is="icon" v-if="icon" class="icon" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  --badge-bg: var(--color-bg-surface-raised);
  --badge-fg: var(--color-text-secondary);
  --badge-border: var(--color-border-default);

  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0.125rem var(--space-xs);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  background-color: var(--badge-bg);
  color: var(--badge-fg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  white-space: nowrap;
}

.badge[data-tone='success'] {
  --badge-bg: var(--color-success-subtle-bg);
  --badge-fg: var(--color-success-subtle-fg);
  --badge-border: var(--color-success-border);
}

.badge[data-tone='danger'] {
  --badge-bg: var(--color-danger-subtle-bg);
  --badge-fg: var(--color-danger-subtle-fg);
  --badge-border: var(--color-danger-border);
}

.badge[data-tone='warning'] {
  --badge-bg: var(--color-warning-subtle-bg);
  --badge-fg: var(--color-warning-subtle-fg);
  --badge-border: var(--color-warning-border);
}

/* Provisional: dashed outline, no fill */
.badge[data-variant='outline'] {
  border-color: var(--badge-border);
  border-style: dashed;
  background-color: transparent;
}

.icon {
  flex: none;
}
</style>
