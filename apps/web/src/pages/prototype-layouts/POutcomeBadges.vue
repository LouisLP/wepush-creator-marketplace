<script setup lang="ts">
// PROTOTYPE (#52) — Bid outcome badges per #51. Advertiser: Lost is neutral-muted, provisional = outline. Creator: Lost is danger.
import type { BidStatus, LossReason } from './fixtures.ts'
import { LOSS } from './fixtures.ts'
import PBadge from './PBadge.vue'

const props = defineProps<{ viewer: 'advertiser' | 'creator', status: BidStatus, lossReason?: LossReason | null, provisional?: boolean, rank?: number | null, iconOnly?: boolean }>()
const lostTone = props.viewer === 'creator' ? 'danger' : 'muted'
</script>

<template>
  <span class="p-row badges">
    <template v-if="iconOnly">
      <PBadge v-if="status === 'pending'" icon="lucide:hourglass" label="Pending" />
      <PBadge v-else-if="status === 'won'" tone="success" icon="lucide:trophy" :label="`Won${rank ? ` · #${rank}` : ''}`" />
      <PBadge v-else :tone="lostTone" icon="lucide:x" label="Lost" />
    </template>
    <template v-else>
      <PBadge v-if="status === 'pending'" icon="lucide:hourglass">Pending</PBadge>
      <PBadge v-else-if="status === 'won'" tone="success" icon="lucide:trophy" :outline="provisional">
        {{ provisional ? 'Would win' : 'Won' }}<template v-if="rank && viewer === 'creator'"> · #{{ rank }}</template>
      </PBadge>
      <PBadge v-else :tone="lostTone" icon="lucide:x" :outline="provisional">
        {{ provisional ? 'Would lose' : 'Lost' }}<template v-if="rank && viewer === 'creator'"> · #{{ rank }}</template>
      </PBadge>
      <PBadge v-if="lossReason" :tone="lostTone" :icon="LOSS[lossReason].icon" :label="LOSS[lossReason].long">{{ LOSS[lossReason].short }}</PBadge>
    </template>
  </span>
</template>

<style scoped>
.badges { gap: var(--space-2xs); }
</style>
