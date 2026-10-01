<script setup lang="ts">
import { listMatchedCampaigns } from '@wepush/contracts'
import { call } from '@/api'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCents, formatTimeLeft } from '@/lib/format.ts'

const matched = useRequest(() => call(listMatchedCampaigns))
defineExpose({ reload: matched.reload })
</script>

<template>
  <nav class="rail" aria-labelledby="matched-heading">
    <h2 id="matched-heading">
      Matched <small class="muted">by Relevance</small>
    </h2>
    <p v-if="matched.error.value" class="alert" role="alert">
      {{ matched.error.value }}
    </p>
    <p v-else-if="matched.data.value?.items.length === 0" class="muted">
      No Matched Campaigns right now.
    </p>
    <ul v-else class="items">
      <li v-for="c in matched.data.value?.items" :key="c.id">
        <RouterLink :to="{ name: 'creator-campaign', params: { campaignId: c.id } }" class="item">
          <span class="relevance" :aria-label="`Relevance ${c.relevance.value}`">{{ c.relevance.value }}</span>
          <span class="body">
            <strong>{{ c.title }}</strong>
            <small class="muted">{{ formatCents(c.suggestedFeeCents) }} suggested · {{ formatTimeLeft(c.biddingDeadline) }}</small>
          </span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.rail {
  display: grid;
  gap: var(--space-sm);
  align-content: start;
}

h2 {
  font-size: var(--font-size-sm);
  text-transform: uppercase;
}

.items {
  display: grid;
  gap: var(--space-2xs);
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  color: inherit;
  text-decoration: none;
}

.item:hover,
.item.router-link-active {
  background-color: var(--color-bg-surface-hover);
}

.relevance {
  min-inline-size: 2.5rem;
  font-size: var(--font-size-lg);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-bold);
  text-align: center;
}

.body {
  display: grid;
}
</style>
