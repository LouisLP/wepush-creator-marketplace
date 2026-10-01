<script setup lang="ts">
import type { AdvertiserBid } from '@wepush/contracts'
import { shallowRef } from 'vue'
import IconChevronDown from '~icons/lucide/chevron-down'
import CpmVsTargetBadge from '@/components/CpmVsTargetBadge.vue'
import ScoreFactors from '@/components/ScoreFactors.vue'
import { formatCents, formatCentsShort, formatCount, formatPercent } from '@/lib/format.ts'
import BidOutcomeBadges from './BidOutcomeBadges.vue'

defineProps<{ bids: AdvertiserBid[], targetCpmCents: number, provisional: boolean }>()

const expanded = shallowRef<string>()
const toggle = (id: string) => expanded.value = expanded.value === id ? undefined : id
</script>

<template>
  <p v-if="!bids.length" class="muted">
    No Bids yet.
  </p>
  <div v-else class="scroll">
    <table>
      <thead>
        <tr>
          <th scope="col" class="num">
            Rank
          </th>
          <th scope="col">
            Creator
          </th>
          <th scope="col" class="num">
            Fee
          </th>
          <th scope="col">
            CPM vs Target
          </th>
          <th scope="col" class="num">
            Score
          </th>
          <th scope="col">
            Outcome
          </th>
          <th scope="col">
            <span class="visually-hidden">Details</span>
          </th>
        </tr>
      </thead>
      <tbody v-for="b in bids" :key="b.id" :class="{ lost: b.status === 'lost', open: expanded === b.id }">
        <tr class="row" @click="toggle(b.id)">
          <td class="num rank">
            #{{ b.rank }}
          </td>
          <td class="handle">
            {{ b.handle }}
          </td>
          <td class="num">
            {{ formatCentsShort(b.feeCents) }}
          </td>
          <td>
            <CpmVsTargetBadge :cpm-cents="b.snapshot.effectiveCpmCents" :target-cpm-cents="targetCpmCents" compact />
          </td>
          <td class="num">
            {{ b.score }}
          </td>
          <td>
            <BidOutcomeBadges :bid="b" :provisional="provisional" />
          </td>
          <td class="end">
            <button
              type="button"
              class="toggle"
              :aria-expanded="expanded === b.id"
              :aria-controls="`bid-${b.id}`"
              :aria-label="`Details for ${b.handle}`"
              @click.stop="toggle(b.id)"
            >
              <IconChevronDown aria-hidden="true" class="chevron" />
            </button>
          </td>
        </tr>
        <tr v-if="expanded === b.id" :id="`bid-${b.id}`" class="detail">
          <td colspan="7">
            <div class="detail-body">
              <ScoreFactors :score="b.score" :factors="b.factors" />
              <dl>
                <div>
                  <dt>Bid Snapshot</dt>
                  <dd>{{ formatCount(b.snapshot.followers) }} followers · {{ formatPercent(b.snapshot.engagementRate) }} engagement</dd>
                </div>
                <div>
                  <dt>Est. Impressions</dt>
                  <dd>{{ formatCount(b.snapshot.estimatedImpressions) }}</dd>
                </div>
                <div>
                  <dt>Effective CPM</dt>
                  <dd>{{ formatCents(b.snapshot.effectiveCpmCents) }}</dd>
                </div>
                <div v-if="b.remainingBudgetCents !== null">
                  <dt>Budget left when reached</dt>
                  <dd>{{ formatCentsShort(b.remainingBudgetCents) }}</dd>
                </div>
              </dl>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.scroll {
  overflow-x: auto;
}

table {
  inline-size: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: var(--space-sm);
  border-block-end: 1px solid var(--color-border-subtle);
  text-align: start;
  vertical-align: middle;
}

th {
  padding-block: var(--space-xs);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.num {
  text-align: end;
  font-variant-numeric: tabular-nums;
}

.rank {
  color: var(--color-text-muted);
}

.handle {
  font-weight: var(--font-weight-medium);
}

.lost .handle {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-normal);
}

.row {
  cursor: pointer;
}

.row:hover td,
.open .row td {
  background-color: var(--color-bg-surface-hover);
}

.end {
  inline-size: 1%;
}

.toggle {
  display: inline-grid;
  place-items: center;
  padding: var(--space-2xs);
  border: 0;
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.toggle:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.toggle[aria-expanded='true'] .chevron {
  rotate: 180deg;
}

@media (prefers-reduced-motion: no-preference) {
  .chevron {
    transition: rotate var(--duration-fast) var(--ease-out);
  }
}

.detail td {
  padding: var(--space-lg) var(--space-md);
  background-color: var(--color-bg-surface-raised);
}

.detail-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--space-xl);
  align-items: start;
}

.detail dl {
  display: grid;
  gap: var(--space-sm);
}

.detail dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.detail dd {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-semibold);
}
</style>
