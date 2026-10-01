<script setup lang="ts" generic="T extends string">
import { CheckboxGroupRoot } from 'reka-ui'
import AppCheckbox from './AppCheckbox.vue'

defineProps<{ options: readonly { value: T, label: string }[] }>()
const model = defineModel<T[]>({ default: () => [] })
</script>

<template>
  <CheckboxGroupRoot v-model="model" class="group" :roving-focus="false">
    <AppCheckbox v-for="o in options" :key="o.value" :value="o.value">
      {{ o.label }}
    </AppCheckbox>
  </CheckboxGroupRoot>
</template>

<style scoped>
.group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-lg);
}
</style>
