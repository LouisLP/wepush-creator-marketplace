<script setup lang="ts">
import { formatCents, formatTimeLeft } from '@/lib/format.ts'
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'

const campaigns = useAdvertiserCampaignsStore()
</script>

<template>
  <nav class="rail" aria-label="Your campaigns">
    <RouterLink :to="{ name: 'advertiser-campaign-new' }" class="btn">
      New Campaign
    </RouterLink>
    <p v-if="campaigns.error" class="alert" role="alert">
      {{ campaigns.error }}
    </p>
    <template v-else-if="campaigns.items">
      <section aria-labelledby="rail-open">
        <h2 id="rail-open">
          Open
        </h2>
        <p v-if="!campaigns.open.length" class="muted">
          None yet.
        </p>
        <ul>
          <li v-for="c in campaigns.open" :key="c.id">
            <RouterLink :to="{ name: 'advertiser-campaign', params: { campaignId: c.id } }">
              <strong>{{ c.title }}</strong>
              <small class="muted">{{ c.bidCount }} {{ c.bidCount === 1 ? 'Bid' : 'Bids' }} · {{ formatTimeLeft(c.biddingDeadline) }}</small>
            </RouterLink>
          </li>
        </ul>
      </section>
      <section v-if="campaigns.closed.length" aria-labelledby="rail-closed">
        <h2 id="rail-closed">
          Closed
        </h2>
        <ul>
          <li v-for="c in campaigns.closed" :key="c.id">
            <RouterLink :to="{ name: 'advertiser-campaign', params: { campaignId: c.id } }">
              <strong>{{ c.title }}</strong>
              <small class="muted">Spent {{ formatCents(c.spentCents ?? 0) }} / {{ formatCents(c.budgetCents) }}</small>
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>
  </nav>
</template>

<style scoped>
.rail {
  display: grid;
  gap: var(--space-md);
}

section {
  display: grid;
  gap: var(--space-xs);
}

h2 {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
}

ul {
  display: grid;
  gap: var(--space-2xs);
  padding: 0;
  list-style: none;
}

li a {
  display: grid;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  color: inherit;
  text-decoration: none;
}

li a:hover,
li a.router-link-active {
  background-color: var(--color-bg-surface-hover);
}
</style>
