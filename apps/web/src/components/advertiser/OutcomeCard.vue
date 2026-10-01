<script setup lang="ts">
import type { AdvertiserCampaign } from '@wepush/contracts'
import { computed } from 'vue'
import IconEye from '~icons/lucide/eye'
import IconGauge from '~icons/lucide/gauge'
import IconHourglass from '~icons/lucide/hourglass'
import IconTrophy from '~icons/lucide/trophy'
import IconWallet from '~icons/lucide/wallet'
import CpmVsTargetBadge from '@/components/CpmVsTargetBadge.vue'
import InfoTip from '@/components/InfoTip.vue'
import AppBadge from '@/components/kit/AppBadge.vue'
import { formatCents, formatCentsShort, formatCount, formatDateTime, formatDollars } from '@/lib/format.ts'

const props = defineProps<{ campaign: AdvertiserCampaign }>()

const winners = computed(() => props.campaign.bids.filter(b => b.status === 'won'))
const share = (cents: number) => Number((100 * cents / props.campaign.budgetCents).toFixed(2))
// Narrower segments can't fit their Rank; the tooltip still names them
const MIN_LABELLED_SHARE = 4
</script>

<template>
  <section class="card outcome" aria-labelledby="outcome-heading">
    <header>
      <h2 id="outcome-heading">
        {{ campaign.provisional ? 'If it closed now' : 'Outcome' }}
      </h2>
      <template v-if="campaign.provisional">
        <AppBadge variant="outline" :icon="IconHourglass">
          Projected
        </AppBadge>
        <InfoTip content="Based on Bids so far; final at the Bidding Deadline." />
      </template>
      <span v-else class="muted closed-at">Closed {{ formatDateTime(campaign.closedAt!) }}</span>
    </header>

    <dl class="kpis">
      <div>
        <dt><IconWallet aria-hidden="true" />Spent</dt>
        <dd :title="formatCents(campaign.outcome.spentCents)">
          {{ formatDollars(campaign.outcome.spentCents) }} <small class="muted">/ {{ formatDollars(campaign.budgetCents) }}</small>
        </dd>
      </div>
      <div>
        <dt><IconTrophy aria-hidden="true" />Winners</dt>
        <dd>{{ campaign.outcome.winnerCount }} <small class="muted">/ {{ campaign.bids.length }} Bids</small></dd>
      </div>
      <div>
        <dt><IconEye aria-hidden="true" />Est. Impressions</dt>
        <dd>{{ formatCount(campaign.outcome.estimatedImpressions) }}</dd>
      </div>
      <div>
        <dt><IconGauge aria-hidden="true" />Blended CPM</dt>
        <dd v-if="campaign.outcome.blendedCpmCents === null">
          —
        </dd>
        <dd v-else>
          {{ formatCentsShort(campaign.outcome.blendedCpmCents) }}
          <CpmVsTargetBadge :cpm-cents="campaign.outcome.blendedCpmCents" :target-cpm-cents="campaign.targetCpmCents" />
        </dd>
      </div>
    </dl>

    <div
      class="budget"
      :class="{ provisional: campaign.provisional }"
      role="img"
      :aria-label="`${formatCentsShort(campaign.outcome.spentCents)} of the ${formatCentsShort(campaign.budgetCents)} Budget filled by ${winners.length} winning Bids in Rank order`"
    >
      <span
        v-for="w in winners"
        :key="w.id"
        class="segment"
        :style="{ inlineSize: `${share(w.feeCents)}%` }"
        :title="`#${w.rank} ${w.handle} · ${formatCentsShort(w.feeCents)}`"
      >{{ share(w.feeCents) >= MIN_LABELLED_SHARE ? `#${w.rank}` : '' }}</span>
    </div>

    <p v-if="!winners.length" class="muted">
      {{ campaign.bids.length ? 'No Bid fits the Budget.' : 'No Bids yet.' }}
    </p>
  </section>
</template>

<style scoped>
.outcome {
  display: grid;
  gap: var(--space-lg);
}

header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
}

h2 {
  margin-inline-end: var(--space-2xs);
  font-size: var(--font-size-lg);
}

.closed-at {
  font-size: var(--font-size-sm);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--space-lg);
}

dt {
  display: flex;
  align-items: center;
  gap: 0.3em;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

dd {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4em;
  margin-block-start: var(--space-2xs);
  font-size: var(--font-size-lg);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-semibold);
}

dd small {
  font-size: var(--font-size-sm);
  white-space: nowrap;
  font-weight: var(--font-weight-normal);
}

.budget {
  display: flex;
  gap: 2px;
  block-size: 1.75rem;
  overflow: hidden;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface-raised);
}

.segment {
  display: grid;
  place-items: center;
  flex: none;
  overflow: hidden;
  border: 1px solid var(--color-secondary-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-secondary-subtle-bg);
  color: var(--color-secondary-subtle-fg);
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.provisional .segment {
  border-style: dashed;
}
</style>
