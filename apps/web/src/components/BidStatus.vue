<script setup lang="ts">
import type { CreatorBid, CreatorCampaign, LossReason, ScoreFactor } from '@wepush/contracts'
import { formatCents, formatCount, formatDateTime, formatPercent, formatTimeLeft } from '@/lib/format.ts'
import FactorBars from './FactorBars.vue'

defineProps<{ bid: CreatorBid, campaign: CreatorCampaign }>()

const STATUS_LABEL: Record<CreatorBid['status'], string> = { pending: 'Pending', won: 'Won', lost: 'Lost' }

const LOSS_COPY: Record<LossReason, string> = {
  requirements_not_met: 'Your profile at the time you bid didn’t meet the Requirements.',
  fee_out_of_range: 'Your Fee was outside the Fee Range.',
  over_budget: 'Your Fee didn’t fit the Remaining Budget.',
}

const SCORE_COPY: Record<ScoreFactor['key'], { label: string, hint: string }> = {
  cpm_fit: { label: 'CPM fit', hint: 'Your Effective CPM against the Target CPM; lower scores higher' },
  engagement: { label: 'Engagement', hint: 'Your engagement rate when you bid, against the Platform baseline' },
}

function vsTarget(effectiveCpmCents: number, targetCpmCents: number) {
  const pct = Math.round((effectiveCpmCents / targetCpmCents - 1) * 100)
  return pct === 0 ? 'at target' : pct < 0 ? `${-pct}% under target` : `${pct}% over target`
}
</script>

<template>
  <div class="status">
    <p class="badge" :class="bid.status">
      {{ STATUS_LABEL[bid.status] }}<template v-if="bid.outcome">
        · Rank #{{ bid.outcome.rank }}
      </template>
    </p>

    <p v-if="!bid.outcome" class="muted">
      Closes {{ formatDateTime(campaign.biddingDeadline) }} ({{ formatTimeLeft(campaign.biddingDeadline) }}).
      Winners are picked automatically then; nothing to do until then.
    </p>
    <p v-else-if="bid.status === 'won'">
      You’re a Winner: make one Post for {{ formatCents(bid.feeCents) }}.
    </p>
    <p v-else-if="bid.outcome.lossReason" class="loss">
      {{ LOSS_COPY[bid.outcome.lossReason] }}
      <template v-if="bid.outcome.lossReason === 'over_budget' && bid.outcome.remainingBudgetCents !== null">
        {{ formatCents(bid.outcome.remainingBudgetCents) }} was left when your Bid was reached; you asked {{ formatCents(bid.feeCents) }}.
      </template>
    </p>

    <dl class="snapshot">
      <div><dt>Your Fee</dt><dd>{{ formatCents(bid.feeCents) }}</dd></div>
      <div>
        <dt>Effective CPM</dt>
        <dd>
          {{ formatCents(bid.snapshot.effectiveCpmCents) }}
          <small class="muted">vs {{ formatCents(campaign.targetCpmCents) }} Target, {{ vsTarget(bid.snapshot.effectiveCpmCents, campaign.targetCpmCents) }}</small>
        </dd>
      </div>
      <div><dt>Estimated Impressions</dt><dd>{{ formatCount(bid.snapshot.estimatedImpressions) }}</dd></div>
      <div>
        <dt>Bid Snapshot</dt>
        <dd>{{ formatCount(bid.snapshot.followers) }} followers · {{ formatPercent(bid.snapshot.engagementRate) }}</dd>
      </div>
      <div><dt>Placed</dt><dd>{{ formatDateTime(bid.placedAt) }}</dd></div>
    </dl>

    <FactorBars v-if="bid.outcome" label="Score" :total="bid.outcome.score" :factors="bid.outcome.factors" :copy="SCORE_COPY">
      <small class="muted">
        Scoring Version {{ bid.outcome.scoringVersion }}. Rank puts Eligible Bids first, then higher Score, lower Fee, earlier Bid.
      </small>
    </FactorBars>
  </div>
</template>

<style scoped>
.status {
  display: grid;
  gap: var(--space-md);
}

.badge {
  justify-self: start;
  padding: var(--space-2xs) var(--space-sm);
  border-radius: var(--radius-full);
  background-color: var(--color-accent-subtle-bg);
  color: var(--color-accent-subtle-fg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.badge.won {
  background-color: var(--color-success-subtle-bg);
  color: var(--color-success-subtle-fg);
}

.badge.lost {
  background-color: var(--color-danger-subtle-bg);
  color: var(--color-danger-subtle-fg);
}

.loss {
  color: var(--color-danger-subtle-fg);
}

.snapshot {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--space-md);
}

dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

dd {
  font-weight: var(--font-weight-semibold);
}

dd small {
  display: block;
  font-weight: var(--font-weight-normal);
}
</style>
