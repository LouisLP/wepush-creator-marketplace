<script setup lang="ts">
import { listAdvertiserCampaigns } from '@wepush/contracts'
import { call } from '@/api'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCents, formatDateTime } from '@/lib/format.ts'

const campaigns = useRequest(() => call(listAdvertiserCampaigns))
</script>

<template>
  <section class="page" aria-labelledby="campaigns-heading">
    <h1 id="campaigns-heading">
      Campaigns
    </h1>
    <p v-if="campaigns.error.value" class="alert" role="alert">
      {{ campaigns.error.value }}
    </p>
    <p v-else-if="campaigns.data.value?.items.length === 0" class="muted">
      No campaigns yet.
    </p>
    <ul v-else class="list">
      <li v-for="c in campaigns.data.value?.items" :key="c.id" class="card">
        <h2>{{ c.title }}</h2>
        <p class="muted">
          {{ c.platform }} · {{ c.status }} · budget {{ formatCents(c.budgetCents) }} · bidding closes {{ formatDateTime(c.biddingDeadline) }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.page,
.list {
  display: grid;
  gap: var(--space-md);
}

.list {
  padding: 0;
  list-style: none;
}

h2 {
  font-size: var(--font-size-lg);
}
</style>
