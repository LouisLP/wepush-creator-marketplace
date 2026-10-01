<script setup lang="ts" generic="K extends string">
export interface FactorRow<K extends string> {
  key: K
  value: number
  weight: number
  contribution: number
}

defineProps<{
  label: string
  total: number
  factors: FactorRow<K>[]
  copy: Record<K, { label: string, hint: string }>
}>()
</script>

<template>
  <figure class="factors">
    <figcaption>
      {{ label }} <strong>{{ Math.round(total) }}</strong><span class="muted"> / 100</span>
    </figcaption>
    <div v-for="f in factors" :key="f.key" class="row">
      <span class="label">
        {{ copy[f.key].label }}
        <small class="muted">{{ Math.round(f.weight * 100) }}% weight</small>
      </span>
      <meter :value="f.value" min="0" max="1" :aria-label="copy[f.key].label" />
      <span class="points">+{{ Math.round(f.contribution) }}</span>
      <small class="hint muted">{{ copy[f.key].hint }}</small>
    </div>
    <slot />
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
