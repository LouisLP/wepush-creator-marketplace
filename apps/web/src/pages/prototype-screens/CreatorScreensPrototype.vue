<script setup lang="ts">
// PROTOTYPE (#22) — Creator flow screen inventory; three IA variants via ?variant=. Mock data, no API.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PrototypeSwitcher from '@/components/PrototypeSwitcher.vue'
import CreatorA from './CreatorA.vue'
import CreatorB from './CreatorB.vue'
import CreatorC from './CreatorC.vue'

const route = useRoute()
const variant = computed(() => (route.query.variant as string) ?? 'A')
</script>

<template>
  <CreatorA v-if="variant === 'A'" />
  <CreatorB v-else-if="variant === 'B'" />
  <CreatorC v-else />
  <PrototypeSwitcher :variants="[{ key: 'A', name: 'Page per step' }, { key: 'B', name: 'Master–detail' }, { key: 'C', name: 'Lifecycle board' }]" />
</template>
