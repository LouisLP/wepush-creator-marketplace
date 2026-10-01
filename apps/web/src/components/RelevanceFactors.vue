<script setup lang="ts">
import type { Relevance, RelevanceFactor } from '@wepush/contracts'

defineProps<{ relevance: Relevance }>()

const COPY: Record<RelevanceFactor['key'], { label: string, hint: string }> = {
  payout: { label: 'Payout', hint: 'Where the Target CPM sits in the Platform’s usual CPM range' },
  budget_fit: { label: 'Budget fit', hint: 'How many Posts at your Parity Fee the Budget could pay for' },
}
</script>

<template>
  <figure class="factors">
    <figcaption>
      Relevance <strong>{{ relevance.value }}</strong><span class="muted"> / 100</span>
    </figcaption>
    <div v-for="f in relevance.factors" :key="f.key" class="row">
      <span class="label">
        {{ COPY[f.key].label }}
        <small class="muted">{{ Math.round(f.weight * 100) }}% weight</small>
      </span>
      <meter :value="f.value" min="0" max="1" :aria-label="COPY[f.key].label" />
      <span class="points">+{{ Math.round(f.contribution) }}</span>
      <small class="hint muted">{{ COPY[f.key].hint }}</small>
    </div>
  </figure>
</template>

<style scoped>
.factors {
  display: grid;
  gap: var(--space-sm);
  margin: 0;
}

figcaption strong {
  font-size: var(--font-size-xl);
}

.row {
  display: grid;
  grid-template-columns: minmax(7rem, 10rem) 1fr auto;
  gap: var(--space-2xs) var(--space-sm);
  align-items: center;
}

.label {
  display: grid;
}

meter {
  inline-size: 100%;
}

.points {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-semibold);
}

.hint {
  grid-column: 1 / -1;
}
</style>
