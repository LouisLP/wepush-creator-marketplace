<script setup lang="ts">
import type { AdvertiserBid } from '@wepush/contracts'
import { shallowRef } from 'vue'
import ScoreFactors from '@/components/ScoreFactors.vue'
import { formatCents, formatCount, formatLossReason, formatPercent } from '@/lib/format.ts'

const props = defineProps<{ bids: AdvertiserBid[], targetCpmCents: number, provisional: boolean }>()

const expanded = shallowRef<string>()
const toggle = (id: string) => expanded.value = expanded.value === id ? undefined : id

function outcomeLabel(b: AdvertiserBid) {
  if (props.provisional)
    return b.status === 'won' ? 'Would win' : 'Would lose'
  return b.status === 'won' ? 'Won' : 'Lost'
}
</script>

<template>
  <p v-if="!bids.length" class="muted">
    No Bids yet.
  </p>
  <div v-else class="scroll">
    <table>
      <thead>
        <tr>
          <th scope="col">
            Rank
          </th>
          <th scope="col">
            Creator
          </th>
          <th scope="col">
            Bid Snapshot
          </th>
          <th scope="col" class="num">
            Est. Impressions
          </th>
          <th scope="col" class="num">
            Fee
          </th>
          <th scope="col" class="num">
            Effective CPM
          </th>
          <th scope="col" class="num">
            Score
          </th>
          <th scope="col">
            Outcome
          </th>
        </tr>
      </thead>
      <tbody v-for="b in bids" :key="b.id" :class="b.status">
        <tr>
          <td>
            <button
              type="button"
              class="toggle"
              :aria-expanded="expanded === b.id"
              :aria-controls="`bid-${b.id}`"
              :aria-label="`Details for ${b.handle}`"
              @click="toggle(b.id)"
            >
              <span aria-hidden="true">{{ expanded === b.id ? '▾' : '▸' }}</span> #{{ b.rank }}
            </button>
          </td>
          <td>
            {{ b.handle }}<br><small class="muted">{{ b.category }}</small>
          </td>
          <td>
            {{ formatCount(b.snapshot.followers) }} followers<br>
            <small class="muted">{{ formatPercent(b.snapshot.engagementRate) }} engagement</small>
          </td>
          <td class="num">
            {{ formatCount(b.snapshot.estimatedImpressions) }}
          </td>
          <td class="num">
            {{ formatCents(b.feeCents) }}
          </td>
          <td class="num" :class="b.snapshot.effectiveCpmCents <= targetCpmCents ? 'under' : 'over'">
            {{ formatCents(b.snapshot.effectiveCpmCents) }}
          </td>
          <td class="num">
            {{ b.score }}
          </td>
          <td>
            {{ outcomeLabel(b) }}
            <br v-if="b.lossReason"><small v-if="b.lossReason" class="muted">{{ formatLossReason(b.lossReason) }}</small>
          </td>
        </tr>
        <tr v-if="expanded === b.id" :id="`bid-${b.id}`" class="detail">
          <td colspan="8">
            <ScoreFactors :score="b.score" :factors="b.factors" />
            <dl>
              <div>
                <dt>Remaining Budget when reached</dt>
                <dd>{{ b.remainingBudgetCents === null ? 'Not reached (not Eligible)' : formatCents(b.remainingBudgetCents) }}</dd>
              </div>
              <div v-if="b.lossReason">
                <dt>Loss Reason</dt>
                <dd>{{ formatLossReason(b.lossReason) }}</dd>
              </div>
            </dl>
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
  padding: var(--space-xs) var(--space-sm);
  border-block-end: 1px solid var(--color-border-subtle);
  text-align: start;
  vertical-align: top;
}

th {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.num {
  text-align: end;
  font-variant-numeric: tabular-nums;
}

.won td:first-child {
  box-shadow: inset 3px 0 var(--color-success-default);
}

.lost {
  color: var(--color-text-secondary);
}

.under {
  color: var(--color-success-subtle-fg);
}

.over {
  color: var(--color-danger-subtle-fg);
}

.toggle {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  white-space: nowrap;
}

.detail td {
  background-color: var(--color-bg-surface-raised);
}

.detail dl {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  margin-block-start: var(--space-md);
}

.detail dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
