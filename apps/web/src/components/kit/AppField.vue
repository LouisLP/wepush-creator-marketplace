<script setup lang="ts">
import { Label } from 'reka-ui'
import { computed, useId } from 'vue'

const { hint, error, as = 'div' } = defineProps<{
  label: string
  hint?: string
  error?: string
  as?: 'div' | 'fieldset'
}>()

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`
const describedby = computed(() => [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <fieldset v-if="as === 'fieldset'" class="field group" :aria-describedby="describedby">
    <legend>{{ label }}</legend>
    <slot :id="id" :describedby="describedby" :invalid="!!error" />
    <small v-if="error" :id="errorId" class="field-error">{{ error }}</small>
    <small v-if="hint" :id="hintId" class="field-hint">{{ hint }}</small>
  </fieldset>
  <div v-else class="field">
    <Label :for="id">{{ label }}</Label>
    <slot :id="id" :describedby="describedby" :invalid="!!error" />
    <small v-if="error" :id="errorId" class="field-error">{{ error }}</small>
    <small v-if="hint" :id="hintId" class="field-hint">{{ hint }}</small>
  </div>
</template>

<style scoped>
.group {
  padding: 0;
  margin: 0;
  border: 0;
}

legend {
  margin-block-end: var(--space-2xs);
  padding: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
