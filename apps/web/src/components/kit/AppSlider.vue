<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { computed } from 'vue'

const { min = 0, max = 100, step = 1 } = defineProps<{
  label: string
  min?: number
  max?: number
  step?: number
}>()
const model = defineModel<number | undefined>()
// Reka's slider is multi-thumb, so it speaks in arrays
const values = computed({
  get: () => [Math.min(Math.max(model.value ?? min, min), max)],
  set: ([v]) => {
    if (v !== undefined)
      model.value = v
  },
})
</script>

<template>
  <SliderRoot v-model="values" class="slider" :min="min" :max="max" :step="step">
    <SliderTrack class="track">
      <SliderRange class="range" />
    </SliderTrack>
    <SliderThumb class="thumb" :aria-label="label" />
  </SliderRoot>
</template>

<style scoped>
.slider {
  position: relative;
  display: flex;
  align-items: center;
  inline-size: 100%;
  block-size: 2.5rem;
  touch-action: none;
  user-select: none;
}

.track {
  position: relative;
  flex: 1;
  block-size: 0.375rem;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface-hover);
}

.range {
  position: absolute;
  block-size: 100%;
  border-radius: inherit;
  background-color: var(--color-accent-default);
}

.thumb {
  display: block;
  inline-size: 1.125rem;
  block-size: 1.125rem;
  border: 2px solid var(--color-accent-default);
  border-radius: var(--radius-full);
  background-color: var(--color-bg-canvas);
  box-shadow: var(--shadow-md);
  cursor: grab;
}

.thumb:hover {
  background-color: var(--color-accent-subtle-bg);
}

.thumb:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
