<script setup lang="ts">
import { listMatchedCampaigns } from '@wepush/contracts'
import { call } from '@/api'
import AppBadge from '@/components/kit/AppBadge.vue'
import { useRequest } from '@/composables/useRequest.ts'

const matched = useRequest(() => call(listMatchedCampaigns))
defineExpose({ reload: matched.reload })
</script>

<template>
  <nav class="rail" aria-labelledby="matched-heading">
    <h2 id="matched-heading" class="rail-heading">
      Matched
    </h2>
    <p v-if="matched.error.value" class="alert" role="alert">
      {{ matched.error.value }}
    </p>
    <p v-else-if="matched.data.value?.items.length === 0" class="muted empty">
      No Matched Campaigns right now.
    </p>
    <ul v-else class="rail-list">
      <li v-for="c in matched.data.value?.items" :key="c.id">
        <RouterLink :to="{ name: 'creator-campaign', params: { campaignId: c.id } }" class="rail-item">
          <span class="rail-title">{{ c.title }}</span>
          <AppBadge class="relevance">
            <span class="visually-hidden">Relevance</span>{{ c.relevance.value }}
          </AppBadge>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.rail {
  display: grid;
  gap: var(--space-xs);
  align-content: start;
}

.relevance {
  font-variant-numeric: tabular-nums;
}

.empty {
  padding-inline: var(--space-sm);
  font-size: var(--font-size-sm);
}
</style>
