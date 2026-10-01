<script setup lang="ts">
// PROTOTYPE (#22) — Spent vs Budget + what the money bought.
import type { Campaign } from './fixtures.ts'
import { computed } from 'vue'
import { bidsFor, count, creatorById, judge, usd, when } from './fixtures.ts'

const props = defineProps<{ campaign: Campaign }>()
const rows = computed(() => judge(props.campaign, bidsFor(props.campaign.id)))
const winners = computed(() => rows.value.filter(r => r.status === 'won'))
const spent = computed(() => winners.value.reduce((s, r) => s + r.bid.feeCents, 0))
const imps = computed(() => winners.value.reduce((s, r) => s + r.bid.estimatedImpressions, 0))
const blended = computed(() => (imps.value ? Math.round(spent.value * 1000 / imps.value) : 0))
const closed = computed(() => props.campaign.status === 'closed')
</script>

<template>
  <div class="sum">
    <p class="muted small">
      {{ closed ? `Closed ${when(campaign.closedAt!)} · Scoring Version v1` : 'Projected if it closed now' }}
    </p>
    <dl>
      <div><dt>{{ closed ? 'Spent' : 'Would spend' }}</dt><dd>{{ usd(spent) }} <small class="muted">of {{ usd(campaign.budgetCents) }}</small></dd></div>
      <div><dt>Winners</dt><dd>{{ winners.length }} <small class="muted">of {{ rows.length }} Bids</small></dd></div>
      <div><dt>Est. Impressions</dt><dd>{{ count(imps) }}</dd></div>
      <div><dt>Blended CPM</dt><dd>{{ usd(blended) }} <small class="muted">target {{ usd(campaign.targetCpmCents) }}</small></dd></div>
    </dl>
    <meter :value="spent" :max="campaign.budgetCents" />
    <ul v-if="closed" class="winners">
      <li v-for="w in winners" :key="w.bid.id">
        #{{ w.rank }} {{ creatorById(w.bid.creatorId).handle }} — {{ usd(w.bid.feeCents) }} · {{ count(w.bid.estimatedImpressions) }} impr.
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sum { display: grid; gap: var(--space-sm); }
dl { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-sm); }
dt { color: var(--color-text-muted); font-size: var(--font-size-sm); }
dd { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
meter { inline-size: 100%; }
.winners { padding-inline-start: var(--space-md); }
.small { font-size: var(--font-size-sm); }
</style>
