<script setup lang="ts">
import { computed } from 'vue'

export type Step = 'review' | 'bid' | 'track' | 'outcome'

const props = defineProps<{ current: Step }>()

const STEPS: { key: Step, label: string }[] = [
  { key: 'review', label: 'Review' },
  { key: 'bid', label: 'Bid' },
  { key: 'track', label: 'Track' },
  { key: 'outcome', label: 'Outcome' },
]

const currentIndex = computed(() => STEPS.findIndex(s => s.key === props.current))
</script>

<template>
  <ol class="steps" aria-label="Progress">
    <li
      v-for="(step, i) in STEPS"
      :key="step.key"
      :class="{ done: i < currentIndex, now: i === currentIndex }"
      :aria-current="i === currentIndex ? 'step' : undefined"
    >
      {{ step.label }}
    </li>
  </ol>
</template>

<style scoped>
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding: 0;
  list-style: none;
  font-size: var(--font-size-sm);
  counter-reset: step;
}

li {
  padding: var(--space-2xs) var(--space-sm);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  counter-increment: step;
}

li::before {
  content: counter(step) ". ";
}

.done {
  border-color: transparent;
  background-color: var(--color-success-subtle-bg);
  color: var(--color-success-subtle-fg);
}

.now {
  border-color: var(--color-accent-default);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}
</style>
