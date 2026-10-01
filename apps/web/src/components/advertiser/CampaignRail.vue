<script setup lang="ts">
import { RouterLink } from 'vue-router'
import IconGavel from '~icons/lucide/gavel'
import IconPlus from '~icons/lucide/plus'
import CampaignStateBadge from '@/components/CampaignStateBadge.vue'
import AppButton from '@/components/kit/AppButton.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import { formatDollars } from '@/lib/format.ts'
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'

const campaigns = useAdvertiserCampaignsStore()

const bidWord = (n: number) => (n === 1 ? 'Bid' : 'Bids')
</script>

<template>
  <nav class="rail" aria-label="Your campaigns">
    <AppButton :as="RouterLink" :to="{ name: 'advertiser-campaign-new' }">
      <IconPlus aria-hidden="true" /> New Campaign
    </AppButton>
    <p v-if="campaigns.error" class="alert" role="alert">
      {{ campaigns.error }}
    </p>
    <template v-else-if="campaigns.items">
      <section aria-labelledby="rail-open">
        <h2 id="rail-open">
          Open
        </h2>
        <p v-if="!campaigns.open.length" class="muted empty">
          None yet.
        </p>
        <ul>
          <li v-for="c in campaigns.open" :key="c.id">
            <RouterLink :to="{ name: 'advertiser-campaign', params: { campaignId: c.id } }" class="item" :title="c.title">
              <PlatformIcon :platform="c.platform" class="platform" />
              <span class="title">{{ c.title }}</span>
              <CampaignStateBadge :status="c.status" :bidding-deadline="c.biddingDeadline" />
              <span class="meta" :title="`${c.bidCount} ${bidWord(c.bidCount)}`">
                <IconGavel aria-hidden="true" />{{ c.bidCount }}<span class="visually-hidden">{{ ` ${bidWord(c.bidCount)}` }}</span>
              </span>
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
            <RouterLink :to="{ name: 'advertiser-campaign', params: { campaignId: c.id } }" class="item" :title="c.title">
              <PlatformIcon :platform="c.platform" class="platform" />
              <span class="title">{{ c.title }}</span>
              <span class="meta">
                <span class="visually-hidden">Spent </span>{{ formatDollars(c.spentCents ?? 0) }} / {{ formatDollars(c.budgetCents) }}
              </span>
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
  gap: var(--space-lg);
}

.rail,
section,
ul {
  grid-template-columns: minmax(0, 1fr);
}

section {
  display: grid;
  gap: var(--space-xs);
}

h2 {
  padding-inline: var(--space-sm);
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: var(--font-size-xs);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.empty {
  padding-inline: var(--space-sm);
  font-size: var(--font-size-sm);
}

ul {
  display: grid;
  gap: var(--space-2xs);
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: inherit;
  font-size: var(--font-size-sm);
  text-decoration: none;
}

.item:hover {
  background-color: var(--color-bg-surface-hover);
}

.item.router-link-active {
  border-color: var(--color-border-default);
  background-color: var(--color-bg-surface-raised);
}

.item:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.platform {
  flex: none;
  color: var(--color-text-muted);
}

.title {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  font-weight: var(--font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.2em;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
}
</style>
