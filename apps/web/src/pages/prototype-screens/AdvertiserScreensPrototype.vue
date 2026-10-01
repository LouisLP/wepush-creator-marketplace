<script setup lang="ts">
// PROTOTYPE (#22) — Advertiser flow screen inventory; three IA variants via ?variant=. Mock data, no API.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PrototypeSwitcher from '@/components/PrototypeSwitcher.vue'
import AdvertiserA from './AdvertiserA.vue'
import AdvertiserB from './AdvertiserB.vue'
import AdvertiserC from './AdvertiserC.vue'

const route = useRoute()
const variant = computed(() => (route.query.variant as string) ?? 'A')
</script>

<template>
  <AdvertiserA v-if="variant === 'A'" />
  <AdvertiserB v-else-if="variant === 'B'" />
  <AdvertiserC v-else />
  <PrototypeSwitcher :variants="[{ key: 'A', name: 'Pages + tabs' }, { key: 'B', name: 'Master–detail scroll' }, { key: 'C', name: 'Dashboard + budget waterfall' }]" />
</template>
