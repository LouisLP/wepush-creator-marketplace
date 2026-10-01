<script setup lang="ts" generic="K extends string">
import InfoTip from './InfoTip.vue'

export interface FactorCopy { label: string, hint: string }

defineProps<{
  label: string
  value: number
  factors: { key: K, value: number, weight: number, contribution: number }[]
  copy: Record<K, FactorCopy>
}>()
</script>

<template>
  <figure class="factors">
    <figcaption>
      {{ label }} <strong>{{ value }}</strong><span class="muted"> / 100</span>
    </figcaption>
    <div v-for="f in factors" :key="f.key" class="row">
      <span class="label">
        <span>{{ copy[f.key].label }} <InfoTip :content="copy[f.key].hint" /></span>
        <small class="muted">{{ Math.round(f.weight * 100) }}% weight</small>
      </span>
      <meter :value="f.value" min="0" max="1" :aria-label="copy[f.key].label" />
      <span class="points">+{{ Math.round(f.contribution) }}</span>
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
  gap: var(--space-xs) var(--space-md);
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
</style>
