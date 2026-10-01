<script setup lang="ts">
import { computed } from 'vue'
import IconArrowDown from '~icons/lucide/arrow-down'
import IconArrowUp from '~icons/lucide/arrow-up'
import IconEqual from '~icons/lucide/equal'
import AppBadge from '@/components/kit/AppBadge.vue'
import AppTooltip from '@/components/kit/AppTooltip.vue'
import { formatCents, formatVsTarget } from '@/lib/format.ts'

const props = defineProps<{ cpmCents: number, targetCpmCents: number }>()

const pct = computed(() => Math.round((props.cpmCents / props.targetCpmCents - 1) * 100))
const chip = computed(() => {
  if (pct.value === 0)
    return { tone: 'success', icon: IconEqual, text: 'on target' } as const
  return pct.value < 0
    ? { tone: 'success', icon: IconArrowDown, text: `${-pct.value}%` } as const
    : { tone: 'warning', icon: IconArrowUp, text: `${pct.value}%` } as const
})
const detail = computed(() => `Effective CPM ${formatCents(props.cpmCents)} vs Target ${formatCents(props.targetCpmCents)}`)
</script>

<template>
  <AppTooltip :content="detail">
    <AppBadge :tone="chip.tone" :icon="chip.icon" tabindex="0" class="chip">
      <span aria-hidden="true">{{ chip.text }}</span>
      <span class="visually-hidden">{{ formatVsTarget(cpmCents, targetCpmCents) }}</span>
    </AppBadge>
  </AppTooltip>
</template>

<style scoped>
.chip {
  font-variant-numeric: tabular-nums;
}

.chip:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
