<script setup lang="ts">
import type { Relevance, RelevanceFactor } from '@wepush/contracts'
import type { FactorCopy } from './FactorBars.vue'
import FactorBars from './FactorBars.vue'

defineProps<{ relevance: Relevance }>()

const COPY: Record<RelevanceFactor['key'], FactorCopy> = {
  payout: { label: 'Payout', hint: 'Where the Target CPM sits in the Platform’s usual CPM range' },
  budget_fit: { label: 'Budget fit', hint: 'How many Posts at your Parity Fee the Budget could pay for' },
}
</script>

<template>
  <FactorBars label="Relevance" :value="relevance.value" :factors="relevance.factors" :copy="COPY" />
</template>
