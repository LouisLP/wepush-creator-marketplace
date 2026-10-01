<script setup lang="ts">
// PROTOTYPE (#52) — compact factor bars: label, meter, weight; the long note goes to a tooltip.
import type { Factor } from './fixtures.ts'

defineProps<{ factors: Factor[] }>()
</script>

<template>
  <dl class="factors">
    <div v-for="f in factors" :key="f.label" :title="f.note">
      <dt>{{ f.label }} <small class="muted">×{{ f.weight }}</small></dt>
      <dd>
        <span class="p-meter"><span :style="{ inlineSize: `${Math.round(f.value * 100)}%` }" /></span>
        <small class="muted p-num">{{ Math.round(f.value * 100) }}</small>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.factors { display: grid; gap: var(--space-xs); font-size: var(--font-size-sm); }
.factors > div { display: grid; grid-template-columns: 8rem 1fr; gap: var(--space-sm); align-items: center; }
dd { display: grid; grid-template-columns: 1fr 2rem; gap: var(--space-xs); align-items: center; text-align: end; }
</style>
