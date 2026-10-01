<script setup lang="ts">
import IconInfo from '~icons/lucide/info'
import AppTooltip from '@/components/kit/AppTooltip.vue'

defineProps<{ content: string }>()
</script>

<template>
  <AppTooltip :content="content">
    <button type="button" class="info" :aria-label="content">
      <IconInfo aria-hidden="true" />
    </button>
  </AppTooltip>
</template>

<style scoped>
.info {
  display: inline-grid;
  place-items: center;
  padding: var(--space-2xs);
  border: 0;
  border-radius: var(--radius-full);
  background-color: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  vertical-align: middle;
  cursor: help;
}

.info:hover {
  color: var(--color-text-primary);
}

.info:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
