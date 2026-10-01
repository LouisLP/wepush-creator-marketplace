<script setup lang="ts">
import type { RequirementCheck } from '@wepush/contracts'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
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
      <IconCheck v-if="c.passed" class="mark" aria-hidden="true" />
      <IconX v-else class="mark" aria-hidden="true" />
      <span class="visually-hidden">{{ c.passed ? 'Met:' : 'Not met:' }}</span>
      {{ describe(c).need }}
      <span :class="c.passed ? 'visually-hidden' : 'you'">(you: {{ describe(c).you }})</span>
    </li>
  </ul>
</template>

<style scoped>
.checks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding: 0;
  list-style: none;
}

li {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-sm);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
}

.pass .mark {
  color: var(--color-success-default);
}

.you {
  opacity: 0.8;
}

.miss {
  border-color: var(--color-danger-border);
  background-color: var(--color-danger-subtle-bg);
  color: var(--color-danger-subtle-fg);
}
</style>
