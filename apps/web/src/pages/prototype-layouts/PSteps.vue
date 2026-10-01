<script setup lang="ts">
// PROTOTYPE (#52) — compact step indicator: dots + current label only.
const props = defineProps<{ current: 'review' | 'bid' | 'track' | 'outcome' }>()
const STEPS = ['review', 'bid', 'track', 'outcome'] as const
const LABEL = { review: 'Review', bid: 'Bid', track: 'Track', outcome: 'Outcome' }
const idx = STEPS.indexOf(props.current)
</script>

<template>
  <ol class="steps" aria-label="Progress">
    <li v-for="(s, i) in STEPS" :key="s" :class="{ done: i < idx, now: i === idx }" :aria-current="i === idx ? 'step' : undefined">
      <span class="dot" aria-hidden="true" /><span :class="i === idx ? 'lbl' : 'visually-hidden'">{{ LABEL[s] }}</span>
    </li>
  </ol>
</template>

<style scoped>
.steps { display: flex; align-items: center; gap: var(--space-2xs); list-style: none; padding: 0; font-size: var(--font-size-xs); color: var(--color-text-secondary); }
li { display: flex; align-items: center; gap: var(--space-2xs); }
.dot { inline-size: 0.5rem; block-size: 0.5rem; border-radius: 50%; background: var(--color-border-default); }
.done .dot { background: var(--color-text-muted); }
.now .dot { inline-size: 0.6rem; block-size: 0.6rem; background: var(--color-text-primary); }
</style>
