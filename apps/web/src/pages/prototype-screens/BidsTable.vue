<script setup lang="ts">
// PROTOTYPE (#22) — Review Bids. Open: provisional standing "if it closed now". Closed: final Rank/Score/Loss Reason.
import type { Campaign } from './fixtures.ts'
import { computed, ref } from 'vue'
import Factors from './Factors.vue'
import { bidsFor, count, creatorById, judge, LOSS_COPY, pct, usd } from './fixtures.ts'

const props = defineProps<{ campaign: Campaign }>()
const rows = computed(() => judge(props.campaign, bidsFor(props.campaign.id)))
const open = ref<string | null>(null)
const closed = computed(() => props.campaign.status === 'closed')
</script>

<template>
  <div>
    <p v-if="!closed" class="muted small">
      Provisional: what Closing would decide if it ran now. Bids are sealed from other Creators and final.
    </p>
    <p v-if="!rows.length" class="muted">
      No Bids yet.
    </p>
    <table v-else>
      <thead>
        <tr><th>{{ closed ? 'Rank' : 'Now' }}</th><th>Creator</th><th>Snapshot</th><th>Fee</th><th>Effective CPM</th><th>Score</th><th>{{ closed ? 'Outcome' : 'Would' }}</th></tr>
      </thead>
      <tbody>
        <template v-for="r in rows" :key="r.bid.id">
          <tr :class="r.status" @click="open = open === r.bid.id ? null : r.bid.id">
            <td>#{{ r.rank }}</td>
            <td>{{ creatorById(r.bid.creatorId).handle }}<br><small class="muted">{{ creatorById(r.bid.creatorId).category }}</small></td>
            <td>{{ count(r.bid.followers) }} · {{ pct(r.bid.engagementRate) }}<br><small class="muted">{{ count(r.bid.estimatedImpressions) }} impr.</small></td>
            <td>{{ usd(r.bid.feeCents) }}</td>
            <td :class="r.bid.effectiveCpmCents <= campaign.targetCpmCents ? 'good' : 'bad'">
              {{ usd(r.bid.effectiveCpmCents) }}
            </td>
            <td>{{ r.score }}</td>
            <td>
              {{ r.status === 'won' ? (closed ? 'Won' : 'win') : (closed ? 'Lost' : 'lose') }}
              <br><small v-if="r.lossReason" class="muted">{{ r.lossReason.replaceAll('_', ' ') }}</small>
            </td>
          </tr>
          <tr v-if="open === r.bid.id" class="detail">
            <td colspan="7">
              <Factors :factors="r.factors" :total="r.score" label="Score" />
              <p class="muted small">
                Budget left when reached: {{ usd(r.remainingBefore) }}.<template v-if="r.lossReason">
                  {{ LOSS_COPY[r.lossReason] }}.
                </template>
              </p>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
table { inline-size: 100%; border-collapse: collapse; }
th, td { padding: var(--space-xs) var(--space-sm); text-align: start; border-bottom: 1px solid var(--color-border-subtle); vertical-align: top; }
tbody tr { cursor: pointer; }
tr.won td:first-child { box-shadow: inset 3px 0 var(--color-success-default); }
.good { color: var(--color-success-subtle-fg); }
.bad { color: var(--color-danger-subtle-fg); }
.detail { cursor: default; background: var(--color-bg-surface-raised); }
.small { font-size: var(--font-size-sm); }
</style>
