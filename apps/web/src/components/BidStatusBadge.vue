<script setup lang="ts">
import type { BidStatus } from '@wepush/contracts'
import type { Component } from 'vue'
import type { BadgeTone } from '@/components/kit/AppBadge.vue'
import { computed } from 'vue'
import IconHourglass from '~icons/lucide/hourglass'
import IconTrophy from '~icons/lucide/trophy'
import IconX from '~icons/lucide/x'
import AppBadge from '@/components/kit/AppBadge.vue'
import AppTooltip from '@/components/kit/AppTooltip.vue'

const props = defineProps<{ status: BidStatus, rank?: number | null, iconOnly?: boolean }>()

const STATUS: Record<BidStatus, { label: string, tone: BadgeTone, icon: Component }> = {
  pending: { label: 'Pending', tone: 'neutral', icon: IconHourglass },
  won: { label: 'Won', tone: 'success', icon: IconTrophy },
  lost: { label: 'Lost', tone: 'danger', icon: IconX },
}

const s = computed(() => STATUS[props.status])
const label = computed(() => props.rank ? `${s.value.label} · Rank #${props.rank}` : s.value.label)
</script>

<template>
  <AppTooltip v-if="iconOnly" :content="label">
    <AppBadge class="status icon-only" :data-status="status" :tone="s.tone" :icon="s.icon">
      <span class="visually-hidden">{{ label }}</span>
    </AppBadge>
  </AppTooltip>
  <AppBadge v-else class="status" :data-status="status" :tone="s.tone" :icon="s.icon">
    {{ label }}
  </AppBadge>
</template>

<style scoped>
.icon-only {
  padding: var(--space-2xs);
}
</style>
