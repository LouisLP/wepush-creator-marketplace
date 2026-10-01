<script setup lang="ts">
import type { ScoreFactor } from '@wepush/contracts'
import type { FactorCopy } from './FactorBars.vue'
import FactorBars from './FactorBars.vue'

defineProps<{ score: number, factors: ScoreFactor[] }>()

const COPY: Record<ScoreFactor['key'], FactorCopy> = {
  cpm_fit: { label: 'CPM fit', hint: 'Effective CPM against the Target CPM; full marks at half the target or less' },
  engagement: { label: 'Engagement', hint: 'Snapshot engagement rate against the Platform’s baseline; full marks at double' },
}
</script>

<template>
  <FactorBars label="Score" :value="score" :factors="factors" :copy="COPY" />
</template>
