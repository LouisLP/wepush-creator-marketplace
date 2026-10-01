<script setup lang="ts">
// PROTOTYPE (#22) — campaign context a Creator sees: brief, requirements checked against their profile, terms.
import type { Campaign } from './fixtures.ts'
import { count, me, meetsRequirements, pct, platformLabel, timeLeft, usd, when } from './fixtures.ts'

const props = defineProps<{ campaign: Campaign }>()
const cr = me()
const misses = meetsRequirements(cr.followers, cr.engagementRate, cr.category, cr.platform, props.campaign)
</script>

<template>
  <div class="brief">
    <p class="muted">
      {{ campaign.advertiser }} · {{ platformLabel(campaign.platform) }} · {{ campaign.status }} · {{ campaign.status === 'open' ? timeLeft(campaign.biddingDeadline) : `closed ${when(campaign.closedAt!)}` }}
    </p>
    <blockquote>{{ campaign.brief }}</blockquote>
    <dl class="terms">
      <div><dt>Budget</dt><dd>{{ usd(campaign.budgetCents) }}</dd></div>
      <div><dt>Target CPM</dt><dd>{{ usd(campaign.targetCpmCents) }}</dd></div>
      <div><dt>Bidding Deadline</dt><dd>{{ when(campaign.biddingDeadline) }}</dd></div>
      <div><dt>Deliverable</dt><dd>1 Post</dd></div>
    </dl>
    <ul class="reqs">
      <li>✓ {{ platformLabel(campaign.platform) }} (you: {{ platformLabel(cr.platform) }})</li>
      <li>✓ Category {{ campaign.categories.join(' / ') }} (you: {{ cr.category }})</li>
      <li>✓ ≥ {{ count(campaign.minFollowers) }} followers (you: {{ count(cr.followers) }})</li>
      <li v-if="campaign.minEngagementRate != null">
        ✓ ≥ {{ pct(campaign.minEngagementRate) }} engagement (you: {{ pct(cr.engagementRate) }})
      </li>
      <li v-for="m in misses" :key="m" class="miss">
        ✗ {{ m }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.brief { display: grid; gap: var(--space-sm); }
blockquote { margin: 0; padding-inline-start: var(--space-md); border-inline-start: 3px solid var(--color-border-default); }
.terms { display: grid; grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr)); gap: var(--space-sm); }
dt { color: var(--color-text-muted); font-size: var(--font-size-sm); }
dd { font-weight: var(--font-weight-semibold); }
.reqs { display: flex; flex-wrap: wrap; gap: var(--space-xs) var(--space-md); padding: 0; list-style: none; font-size: var(--font-size-sm); color: var(--color-success-subtle-fg); }
.miss { color: var(--color-danger-default); }
</style>
