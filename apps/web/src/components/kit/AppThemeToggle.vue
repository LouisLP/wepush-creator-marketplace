<script setup lang="ts">
import { computed } from 'vue'
import IconMoon from '~icons/lucide/moon'
import IconSun from '~icons/lucide/sun'
import { useTheme } from '@/composables/useTheme.ts'

const { theme, toggle } = useTheme()
const label = computed(() => `Switch to ${theme.value === 'dark' ? 'light' : 'dark'} theme`)
</script>

<template>
  <button type="button" class="toggle" :aria-label="label" :title="label" @click="toggle">
    <IconMoon v-if="theme === 'dark'" aria-hidden="true" />
    <IconSun v-else aria-hidden="true" />
  </button>
</template>

<style scoped>
.toggle {
  display: inline-grid;
  place-items: center;
  padding: var(--space-xs);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-full);
  background-color: transparent;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  cursor: pointer;
}

.toggle:hover {
  background-color: var(--color-bg-surface-hover);
}

.toggle:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
