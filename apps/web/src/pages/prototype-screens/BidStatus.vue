<script setup lang="ts">
// PROTOTYPE (#22) — Track Bid / View Outcome for the current Creator's Bid.
import type { Bid, Campaign } from './fixtures.ts'
import Factors from './Factors.vue'
import { count, LOSS_COPY, pct, timeLeft, usd, when } from './fixtures.ts'

defineProps<{ bid: Bid, campaign: Campaign }>()
</script>

<template>
  <div class="status">
    <p class="badge" :class="bid.status">
      {{ bid.status.toUpperCase() }}<template v-if="bid.rank">
        · Rank #{{ bid.rank }}
      </template>
    </p>
    <p v-if="bid.status === 'pending'" class="muted">
      Closes {{ when(campaign.biddingDeadline) }} ({{ timeLeft(campaign.biddingDeadline) }}). Winners are chosen automatically then — nothing to do until then.
    </p>
    <p v-else-if="bid.status === 'won'">
      You're a Winner: make 1 Post for {{ usd(bid.feeCents) }}.
    </p>
    <p v-else-if="bid.lossReason" class="loss">
      {{ LOSS_COPY[bid.lossReason] }}<template v-if="bid.lossReason === 'over_budget'">
        — {{ usd(bid.remainingBudgetCents!) }} was left when your Bid was reached; you asked {{ usd(bid.feeCents) }}.
      </template>
    </p>
    <dl class="snap">
      <div><dt>Your Fee</dt><dd>{{ usd(bid.feeCents) }}</dd></div>
      <div><dt>Effective CPM</dt><dd>{{ usd(bid.effectiveCpmCents) }} <small class="muted">target {{ usd(campaign.targetCpmCents) }}</small></dd></div>
      <div><dt>Est. Impressions</dt><dd>{{ count(bid.estimatedImpressions) }}</dd></div>
      <div><dt>Snapshot</dt><dd>{{ count(bid.followers) }} · {{ pct(bid.engagementRate) }}</dd></div>
      <div><dt>Placed</dt><dd>{{ when(bid.placedAt) }}</dd></div>
    </dl>
    <Factors v-if="bid.factors" :factors="bid.factors" :total="bid.score!" label="Score" />
    <p v-if="bid.factors" class="muted small">
      Scoring Version v1 · Rank = Eligible Bids first, then Score, then lower Fee, then earlier Bid.
    </p>
  </div>
</template>

<style scoped>
.status { display: grid; gap: var(--space-sm); }
.badge { justify-self: start; padding: var(--space-2xs) var(--space-sm); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); background: var(--color-bg-surface-raised); }
.badge.won { background: var(--color-success-subtle-bg); color: var(--color-success-subtle-fg); }
.badge.lost { background: var(--color-danger-subtle-bg); color: var(--color-danger-subtle-fg); }
.loss { color: var(--color-danger-subtle-fg); }
.snap { display: grid; grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr)); gap: var(--space-sm); }
dt { color: var(--color-text-muted); font-size: var(--font-size-sm); }
dd { font-weight: var(--font-weight-semibold); }
.small { font-size: var(--font-size-sm); }
</style>
