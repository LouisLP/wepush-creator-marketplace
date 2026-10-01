<script setup lang="ts">
import type { CreatorBid, CreatorCampaign } from '@wepush/contracts'
import IconCalendarClock from '~icons/lucide/calendar-clock'
import { formatCents, formatDateTime, formatLossReason, formatTimeLeft } from '@/lib/format.ts'
import BidStatusBadge from './BidStatusBadge.vue'
import CpmVsTargetBadge from './CpmVsTargetBadge.vue'

defineProps<{ bid: CreatorBid, campaign: CreatorCampaign }>()

function remainingNote({ outcome }: CreatorBid) {
  if (outcome?.lossReason !== 'over_budget' || outcome.remainingBudgetCents === null)
    return ''
  return `: ${formatCents(outcome.remainingBudgetCents)} left when your Bid was reached.`
}
</script>

<template>
  <div class="bid-status">
    <p class="row">
      <BidStatusBadge :status="bid.status" :rank="bid.outcome?.rank" />
    </p>

    <p class="row facts">
      <span>Your Fee <strong>{{ formatCents(bid.feeCents) }}</strong></span>
      <span>
        Effective CPM <strong>{{ formatCents(bid.snapshot.effectiveCpmCents) }}</strong>
        <span class="muted"> vs {{ formatCents(campaign.targetCpmCents) }}</span>
      </span>
      <CpmVsTargetBadge :cpm-cents="bid.snapshot.effectiveCpmCents" :target-cpm-cents="campaign.targetCpmCents" />
      <template v-if="bid.outcome">
        <span>Rank <strong>#{{ bid.outcome.rank }}</strong></span>
        <span>Score <strong>{{ bid.outcome.score }}</strong></span>
      </template>
    </p>

    <p v-if="!bid.outcome" class="muted">
      <IconCalendarClock aria-hidden="true" />
      Winners are picked at the Bidding Deadline, {{ formatDateTime(campaign.biddingDeadline) }} ({{ formatTimeLeft(campaign.biddingDeadline) }}).
    </p>
    <p v-else-if="bid.status === 'won'">
      You’re a Winner: make one Post for {{ formatCents(bid.feeCents) }}.
    </p>
    <p v-else-if="bid.outcome.lossReason" class="loss">
      {{ formatLossReason(bid.outcome.lossReason) }}{{ remainingNote(bid) }}
    </p>
  </div>
</template>

<style scoped>
.bid-status {
  display: grid;
  gap: var(--space-md);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-lg);
}

strong {
  font-variant-numeric: tabular-nums;
}

.facts {
  gap: var(--space-xs) var(--space-md);
}

svg {
  vertical-align: -0.125em;
}

.loss {
  color: var(--color-danger-subtle-fg);
}
</style>
