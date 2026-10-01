<script setup lang="ts">
import { computed } from 'vue'
import IconArrowDown from '~icons/lucide/arrow-down'
import IconArrowUp from '~icons/lucide/arrow-up'
import IconEqual from '~icons/lucide/equal'
import AppBadge from '@/components/kit/AppBadge.vue'
import AppTooltip from '@/components/kit/AppTooltip.vue'
import { formatCents, formatVsTarget } from '@/lib/format.ts'

const props = defineProps<{
  cpmCents: number
  targetCpmCents: number
  /** Just the percentage; the full comparison moves to a tooltip. */
  compact?: boolean
}>()

const icon = computed(() => props.cpmCents < props.targetCpmCents ? IconArrowDown : props.cpmCents > props.targetCpmCents ? IconArrowUp : IconEqual)
const tone = computed(() => props.cpmCents > props.targetCpmCents ? 'warning' : 'success')
const pct = computed(() => Math.abs(Math.round((props.cpmCents / props.targetCpmCents - 1) * 100)))
const detail = computed(() => `Effective CPM ${formatCents(props.cpmCents)} vs Target ${formatCents(props.targetCpmCents)}`)
</script>

<template>
  <AppTooltip v-if="compact" :content="detail">
    <AppBadge class="vs-target" :tone="tone" :icon="icon" tabindex="0">
      <span aria-hidden="true">{{ pct ? `${pct}%` : 'on target' }}</span>
      <span class="visually-hidden">{{ formatVsTarget(cpmCents, targetCpmCents) }}</span>
    </AppBadge>
  </AppTooltip>
  <AppBadge v-else class="vs-target" :tone="tone" :icon="icon">
    {{ formatVsTarget(cpmCents, targetCpmCents) }}
  </AppBadge>
</template>

<style scoped>
.vs-target {
  font-variant-numeric: tabular-nums;
}

.vs-target:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
