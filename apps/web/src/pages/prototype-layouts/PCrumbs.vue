<script setup lang="ts">
// PROTOTYPE (#52) — in-page breadcrumb replacing "Switch" (#49).
import { Icon } from '@iconify/vue'
import { useProtoState } from './state.ts'

defineProps<{ actor: string, campaign?: string }>()
const { hub, to } = useProtoState()
</script>

<template>
  <nav aria-label="Breadcrumb" class="crumbs p-small">
    <RouterLink :to="to({ hub })">
      {{ hub === 'advertisers' ? 'Advertisers' : 'Creators' }}
    </RouterLink>
    <Icon icon="lucide:chevron-right" aria-hidden="true" />
    <RouterLink v-if="campaign" :to="to({ c: null })">
      {{ actor }}
    </RouterLink>
    <span v-else aria-current="page">{{ actor }}</span>
    <template v-if="campaign">
      <Icon icon="lucide:chevron-right" aria-hidden="true" />
      <span aria-current="page">{{ campaign }}</span>
    </template>
  </nav>
</template>

<style scoped>
.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2xs); color: var(--color-text-muted); }
.crumbs a { color: var(--color-text-secondary); text-decoration: none; }
.crumbs a:hover { text-decoration: underline; }
[aria-current] { color: var(--color-text-primary); }
</style>
