<script setup lang="ts">
// PROTOTYPE (#22) — factor breakdown for Relevance / Score.
import type { Factor } from './fixtures.ts'

defineProps<{ factors: Factor[], total: number, label: string }>()
</script>

<template>
  <figure class="factors">
    <figcaption><strong>{{ label }} {{ total }}</strong> / 100</figcaption>
    <div v-for="f in factors" :key="f.key" class="row">
      <span>{{ f.label }} <small class="muted">×{{ f.weight }}</small></span>
      <meter :value="f.value" min="0" max="1" />
      <small class="muted">{{ f.note }}</small>
    </div>
  </figure>
</template>

<style scoped>
.factors { display: grid; gap: var(--space-xs); margin: 0; }
.row { display: grid; grid-template-columns: 9rem 8rem 1fr; gap: var(--space-sm); align-items: center; }
meter { inline-size: 100%; }
</style>
