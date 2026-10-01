<script setup lang="ts">
import { computed } from 'vue'
import IconArrowDown from '~icons/lucide/arrow-down'
import IconArrowUp from '~icons/lucide/arrow-up'
import IconEqual from '~icons/lucide/equal'
import AppBadge from '@/components/kit/AppBadge.vue'
import { formatVsTarget } from '@/lib/format.ts'

const props = defineProps<{ cpmCents: number, targetCpmCents: number }>()

const icon = computed(() => props.cpmCents < props.targetCpmCents ? IconArrowDown : props.cpmCents > props.targetCpmCents ? IconArrowUp : IconEqual)
</script>

<template>
  <AppBadge class="vs-target" :tone="cpmCents > targetCpmCents ? 'warning' : 'success'" :icon="icon">
    {{ formatVsTarget(cpmCents, targetCpmCents) }}
  </AppBadge>
</template>
