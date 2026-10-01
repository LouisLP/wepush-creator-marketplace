<script setup lang="ts">
// PROTOTYPE (#22) — Variant C: portfolio dashboard + budget waterfall. Bids drawn as bars filling the Budget in Rank order.
import { computed, ref } from 'vue'
import CampaignForm from './CampaignForm.vue'
import CampaignTerms from './CampaignTerms.vue'
import Factors from './Factors.vue'
import { bidsFor, closeCampaign, count, creatorById, db, judge, LOSS_COPY, myCampaigns, timeLeft, usd } from './fixtures.ts'

const list = computed(() => myCampaigns().map((c) => {
  const j = judge(c, bidsFor(c.id))
  const w = j.filter(r => r.status === 'won')
  const spent = w.reduce((s, r) => s + r.bid.feeCents, 0)
  const imps = w.reduce((s, r) => s + r.bid.estimatedImpressions, 0)
  return { c, bids: j.length, winners: w.length, spent, cpm: imps ? Math.round(spent * 1000 / imps) : 0 }
}))
const selected = ref<string | null>(null)
const creating = ref(false)
const camp = computed(() => db.campaigns.find(c => c.id === selected.value))
const rows = computed(() => (camp.value ? judge(camp.value, bidsFor(camp.value.id)) : []))
const focus = ref<string | null>(null)
const pctOf = (cents: number) => `${(100 * cents / (camp.value?.budgetCents ?? 1)).toFixed(2)}%`
</script>

<template>
  <div class="c">
    <template v-if="creating">
      <button class="btn btn-ghost" @click="creating = false">
        ← Dashboard
      </button>
      <CampaignForm @created="id => { creating = false; selected = id }" />
    </template>
    <template v-else>
      <header class="row">
        <h1>Dashboard</h1>
        <button class="btn" @click="creating = true">
          New Campaign
        </button>
      </header>
      <table>
        <thead><tr><th>Campaign</th><th>State</th><th>Bids</th><th>Winners*</th><th>Spend* / Budget</th><th>Blended CPM* / Target</th></tr></thead>
        <tbody>
          <tr v-for="r in list" :key="r.c.id" :class="{ on: selected === r.c.id }" @click="selected = r.c.id">
            <td><strong>{{ r.c.title }}</strong></td>
            <td>{{ r.c.status === 'open' ? timeLeft(r.c.biddingDeadline) : 'closed' }}</td>
            <td>{{ r.bids }}</td>
            <td>{{ r.winners }}</td>
            <td>{{ usd(r.spent) }} / {{ usd(r.c.budgetCents) }}</td>
            <td :class="r.cpm && r.cpm <= r.c.targetCpmCents ? 'good' : 'bad'">
              {{ r.cpm ? usd(r.cpm) : '—' }} / {{ usd(r.c.targetCpmCents) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p class="muted small">
        * projected for Open Campaigns, final for Closed.
      </p>

      <section v-if="camp" class="card detail">
        <header class="row">
          <h2>{{ camp.title }} — Budget {{ usd(camp.budgetCents) }}</h2>
          <button v-if="camp.status === 'open'" class="btn btn-ghost" @click="closeCampaign(camp.id)">
            ⚙ Simulate worker close
          </button>
        </header>
        <div class="waterfall" aria-label="Budget filled by Bids in Rank order">
          <template v-for="r in rows" :key="r.bid.id">
            <span v-if="r.status === 'won'" class="seg" :style="{ width: pctOf(r.bid.feeCents) }" :title="`#${r.rank} ${creatorById(r.bid.creatorId).handle} ${usd(r.bid.feeCents)}`" @click="focus = r.bid.id">#{{ r.rank }}</span>
          </template>
        </div>
        <ol class="ladder">
          <li v-for="r in rows" :key="r.bid.id" :class="r.status" @click="focus = focus === r.bid.id ? null : r.bid.id">
            <span>#{{ r.rank }} {{ creatorById(r.bid.creatorId).handle }}</span>
            <span>{{ usd(r.bid.feeCents) }} · eCPM {{ usd(r.bid.effectiveCpmCents) }} · {{ count(r.bid.estimatedImpressions) }} impr. · Score {{ r.score }}</span>
            <span>{{ r.status === 'won' ? '✓ within Budget' : r.lossReason ? `✗ ${LOSS_COPY[r.lossReason]} (left: ${usd(r.remainingBefore)})` : '' }}</span>
            <Factors v-if="focus === r.bid.id" :factors="r.factors" :total="r.score" label="Score" class="f" />
          </li>
        </ol>
        <details>
          <summary>Terms</summary>
          <CampaignTerms :campaign="camp" />
        </details>
      </section>
    </template>
  </div>
</template>

<style scoped>
.c { display: grid; gap: var(--space-md); }
.row { display: flex; justify-content: space-between; align-items: center; }
table { inline-size: 100%; border-collapse: collapse; }
th, td { padding: var(--space-xs) var(--space-sm); text-align: start; border-bottom: 1px solid var(--color-border-subtle); }
tbody tr { cursor: pointer; }
tbody tr:hover, tr.on { background: var(--color-bg-surface-hover); }
.good { color: var(--color-success-subtle-fg); }
.bad { color: var(--color-danger-subtle-fg); }
.small { font-size: var(--font-size-sm); }
.detail { display: grid; gap: var(--space-md); }
.waterfall { display: flex; block-size: 2rem; border: 1px solid var(--color-border-default); border-radius: var(--radius-md); overflow: hidden; }
.seg { display: grid; place-items: center; border-inline-end: 2px solid var(--color-bg-surface); background: var(--color-secondary-default); color: var(--color-text-on-accent); font-size: var(--font-size-xs); cursor: pointer; }
.ladder { display: grid; gap: var(--space-xs); padding: 0; list-style: none; }
.ladder li { display: grid; grid-template-columns: 12rem 1fr auto; gap: var(--space-sm); padding: var(--space-xs) var(--space-sm); border-inline-start: 3px solid var(--color-border-default); cursor: pointer; }
.ladder li.won { border-color: var(--color-success-default); }
.ladder li.lost { color: var(--color-text-secondary); }
.f { grid-column: 1 / -1; }
</style>
