<script setup lang="ts">
import type { AdvertiserCampaign } from '@wepush/contracts'
import { computed } from 'vue'
import { formatCents, formatCount, formatDateTime } from '@/lib/format.ts'

const props = defineProps<{ campaign: AdvertiserCampaign }>()

const winners = computed(() => props.campaign.bids.filter(b => b.status === 'won'))
const share = (cents: number) => `${(100 * cents / props.campaign.budgetCents).toFixed(2)}%`
</script>

<template>
  <section class="card outcome" aria-labelledby="outcome-heading">
    <header>
      <h2 id="outcome-heading">
        {{ campaign.provisional ? 'If it closed now' : 'Winners' }}
      </h2>
      <p class="muted">
        <template v-if="campaign.provisional">
          Projected from the Bids so far; Closing decides for real after the Bidding Deadline.
        </template>
        <template v-else>
          Closed {{ formatDateTime(campaign.closedAt!) }} · Scoring Version {{ campaign.scoringVersion }}
        </template>
      </p>
    </header>

    <dl class="stats">
      <div>
        <dt>{{ campaign.provisional ? 'Projected spend' : 'Spent' }}</dt>
        <dd>{{ formatCents(campaign.outcome.spentCents) }} <small class="muted">of {{ formatCents(campaign.budgetCents) }}</small></dd>
      </div>
      <div>
        <dt>Winners</dt>
        <dd>{{ campaign.outcome.winners }} <small class="muted">of {{ campaign.bids.length }} Bids</small></dd>
      </div>
      <div>
        <dt>Est. Impressions</dt>
        <dd>{{ formatCount(campaign.outcome.estimatedImpressions) }}</dd>
      </div>
      <div>
        <dt>Blended CPM</dt>
        <dd>
          {{ campaign.outcome.blendedCpmCents === null ? '—' : formatCents(campaign.outcome.blendedCpmCents) }}
          <small class="muted">target {{ formatCents(campaign.targetCpmCents) }}</small>
        </dd>
      </div>
    </dl>

    <div
      class="budget"
      role="img"
      :aria-label="`${formatCents(campaign.outcome.spentCents)} of the ${formatCents(campaign.budgetCents)} Budget filled by ${winners.length} winning Bids in Rank order`"
    >
      <span
        v-for="w in winners"
        :key="w.id"
        class="segment"
        :style="{ inlineSize: share(w.feeCents) }"
        :title="`#${w.rank} ${w.handle} · ${formatCents(w.feeCents)}`"
      >#{{ w.rank }}</span>
    </div>

    <p v-if="!winners.length" class="muted">
      {{ campaign.bids.length ? 'No Bid fits the Budget.' : 'No Bids yet.' }}
    </p>
    <ol v-else class="winners">
      <li v-for="w in winners" :key="w.id">
        <span class="rank">#{{ w.rank }}</span>
        <strong>{{ w.handle }}</strong>
        <span class="muted">{{ formatCents(w.feeCents) }} · {{ formatCount(w.snapshot.estimatedImpressions) }} impr. · eCPM {{ formatCents(w.snapshot.effectiveCpmCents) }}</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.outcome,
header {
  display: grid;
  gap: var(--space-md);
}

header {
  gap: var(--space-2xs);
}

h2 {
  font-size: var(--font-size-lg);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--space-md);
}

dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

dd {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

dd small {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
}

.budget {
  display: flex;
  block-size: 2rem;
  overflow: hidden;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-canvas);
}

.segment {
  display: grid;
  place-items: center;
  overflow: hidden;
  border-inline-end: 2px solid var(--color-bg-surface);
  background-color: var(--color-secondary-default);
  color: var(--color-text-on-accent);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.winners {
  display: grid;
  gap: var(--space-2xs);
  padding: 0;
  list-style: none;
}

.winners li {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: baseline;
}

.rank {
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
}
</style>
