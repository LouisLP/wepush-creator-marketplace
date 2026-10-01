<script setup lang="ts">
// PROTOTYPE (#22) — Review Campaign (advertiser): terms as created.
import type { Campaign } from './fixtures.ts'
import { count, pct, platformLabel, timeLeft, usd, when } from './fixtures.ts'

defineProps<{ campaign: Campaign }>()
</script>

<template>
  <div class="terms">
    <p class="muted">
      {{ campaign.status }} · {{ campaign.status === 'open' ? `bidding closes ${when(campaign.biddingDeadline)} (${timeLeft(campaign.biddingDeadline)})` : `closed ${when(campaign.closedAt!)}` }}
    </p>
    <blockquote>{{ campaign.brief }}</blockquote>
    <dl>
      <div><dt>Platform</dt><dd>{{ platformLabel(campaign.platform) }}</dd></div>
      <div><dt>Categories</dt><dd>{{ campaign.categories.join(', ') }}</dd></div>
      <div><dt>Min followers</dt><dd>{{ count(campaign.minFollowers) }}</dd></div>
      <div><dt>Min engagement</dt><dd>{{ campaign.minEngagementRate == null ? '—' : pct(campaign.minEngagementRate) }}</dd></div>
      <div><dt>Budget</dt><dd>{{ usd(campaign.budgetCents) }}</dd></div>
      <div><dt>Target CPM</dt><dd>{{ usd(campaign.targetCpmCents) }}</dd></div>
    </dl>
  </div>
</template>

<style scoped>
.terms { display: grid; gap: var(--space-sm); }
blockquote { margin: 0; padding-inline-start: var(--space-md); border-inline-start: 3px solid var(--color-border-default); }
dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr)); gap: var(--space-sm); }
dt { color: var(--color-text-muted); font-size: var(--font-size-sm); }
dd { font-weight: var(--font-weight-semibold); }
</style>
