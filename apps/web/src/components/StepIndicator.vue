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
      <span class="dot" aria-hidden="true" />
      <span :class="{ 'visually-hidden': i !== currentIndex }">{{ step.label }}</span>
    </li>
  </ol>
</template>

<style scoped>
.steps {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0;
  list-style: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

li {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.dot {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: var(--radius-full);
  background-color: var(--color-border-default);
}

.done .dot {
  background-color: var(--color-success-default);
}

.now .dot {
  inline-size: 0.625rem;
  block-size: 0.625rem;
  background-color: var(--color-accent-default);
}

.now {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}
</style>
