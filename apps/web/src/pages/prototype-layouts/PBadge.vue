<script setup lang="ts">
// PROTOTYPE (#52) — Badge per #51: tone × subtle/outline, optional leading icon.
import { Icon } from '@iconify/vue'

withDefaults(defineProps<{ tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'muted', outline?: boolean, icon?: string, label?: string }>(), { tone: 'neutral' })
</script>

<template>
  <span class="p-badge" :class="[tone, { outline }]" :title="label">
    <Icon v-if="icon" :icon="icon" aria-hidden="true" />
    <slot />
  </span>
</template>
