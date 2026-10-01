<script setup lang="ts">
import type { RequirementCheck } from '@wepush/contracts'
import { formatCount, formatPercent, formatPlatform } from '@/lib/format.ts'

defineProps<{ checks: RequirementCheck[] }>()

function describe(c: RequirementCheck): { need: string, you: string } {
  switch (c.requirement) {
    case 'platform': return { need: `On ${formatPlatform(c.required)}`, you: formatPlatform(c.actual) }
    case 'category': return { need: `Category: ${c.required.join(', ')}`, you: c.actual }
    case 'minFollowers': return { need: `At least ${formatCount(c.required)} followers`, you: formatCount(c.actual) }
    case 'minEngagement': return {
      need: c.required === null ? 'Any engagement rate' : `At least ${formatPercent(c.required)} engagement`,
      you: formatPercent(c.actual),
    }
  }
}
</script>

<template>
  <ul class="checks">
    <li v-for="c in checks" :key="c.requirement" :class="c.passed ? 'pass' : 'miss'">
      <span class="mark" aria-hidden="true">{{ c.passed ? '✓' : '✗' }}</span>
      <span class="visually-hidden">{{ c.passed ? 'Met:' : 'Not met:' }}</span>
      {{ describe(c).need }}
      <small class="muted">you: {{ describe(c).you }}</small>
    </li>
  </ul>
</template>

<style scoped>
.checks {
  display: grid;
  gap: var(--space-2xs);
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: baseline;
}

.mark {
  font-weight: var(--font-weight-bold);
}

.pass .mark {
  color: var(--color-success-default);
}

.miss {
  color: var(--color-danger-default);
}
</style>
