<script setup lang="ts">
// PROTOTYPE (#52) — adapter over the real AppBadge (+ AppTooltip when labelled) taking Iconify names.
import type { BadgeTone } from '@/components/kit/AppBadge.vue'
import { Icon } from '@iconify/vue'
import { computed, h } from 'vue'
import AppBadge from '@/components/kit/AppBadge.vue'
import AppTooltip from '@/components/kit/AppTooltip.vue'

const props = defineProps<{ tone?: BadgeTone | 'muted', outline?: boolean, icon?: string, label?: string }>()
const iconCmp = computed(() => (props.icon ? () => h(Icon, { icon: props.icon! }) : undefined))
const tone = computed<BadgeTone>(() => (props.tone === 'muted' || !props.tone ? 'neutral' : props.tone))
</script>

<template>
  <AppTooltip v-if="label" :content="label">
    <AppBadge :tone="tone" :variant="outline ? 'outline' : 'subtle'" :icon="iconCmp" :class="{ muted: props.tone === 'muted' }" tabindex="0" :aria-label="$slots.default ? undefined : label">
      <slot />
    </AppBadge>
  </AppTooltip>
  <AppBadge v-else :tone="tone" :variant="outline ? 'outline' : 'subtle'" :icon="iconCmp" :class="{ muted: props.tone === 'muted' }">
    <slot />
  </AppBadge>
</template>

<style scoped>
.muted { opacity: 0.7; }
</style>
