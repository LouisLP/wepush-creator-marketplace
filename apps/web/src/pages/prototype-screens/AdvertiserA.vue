<script setup lang="ts">
// PROTOTYPE (#22) — Variant A: pages. List → New → Campaign detail with tabs (Overview | Bids | Outcome).
import { computed, ref } from 'vue'
import BidsTable from './BidsTable.vue'
import CampaignForm from './CampaignForm.vue'
import CampaignTerms from './CampaignTerms.vue'
import { bidsFor, closeCampaign, db, myCampaigns, platformLabel, timeLeft, usd } from './fixtures.ts'
import OutcomeSummary from './OutcomeSummary.vue'

type Screen = { name: 'list' } | { name: 'new' } | { name: 'detail', id: string, tab: 'overview' | 'bids' | 'outcome' }
const screen = ref<Screen>({ name: 'list' })
const list = computed(() => myCampaigns())
const camp = computed(() => (screen.value.name === 'detail' ? db.campaigns.find(c => c.id === (screen.value as any).id)! : null))
function tab(t: 'overview' | 'bids' | 'outcome') {
  if (screen.value.name === 'detail')
    screen.value = { ...screen.value, tab: t }
}
</script>

<template>
  <div class="a">
    <section v-if="screen.name === 'list'" class="stack">
      <header class="row">
        <h1>Campaigns</h1>
        <button class="btn" @click="screen = { name: 'new' }">
          New Campaign
        </button>
      </header>
      <table>
        <thead><tr><th>Campaign</th><th>Status</th><th>Bids</th><th>Budget</th><th>Spent</th><th>Deadline</th></tr></thead>
        <tbody>
          <tr v-for="c in list" :key="c.id" @click="screen = { name: 'detail', id: c.id, tab: c.status === 'closed' ? 'outcome' : 'bids' }">
            <td><strong>{{ c.title }}</strong><br><small class="muted">{{ platformLabel(c.platform) }}</small></td>
            <td>{{ c.status }}</td>
            <td>{{ bidsFor(c.id).length }}</td>
            <td>{{ usd(c.budgetCents) }}</td>
            <td>{{ c.spentCents == null ? '—' : usd(c.spentCents) }}</td>
            <td>{{ c.status === 'open' ? timeLeft(c.biddingDeadline) : 'closed' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-else-if="screen.name === 'new'" class="stack">
      <button class="btn btn-ghost back" @click="screen = { name: 'list' }">
        ← Campaigns
      </button>
      <h1>New Campaign</h1>
      <CampaignForm @created="id => screen = { name: 'detail', id, tab: 'overview' }" />
    </section>

    <section v-else-if="camp && screen.name === 'detail'" class="stack">
      <button class="btn btn-ghost back" @click="screen = { name: 'list' }">
        ← Campaigns
      </button>
      <header class="row">
        <h1>{{ camp.title }}</h1>
        <button v-if="camp.status === 'open'" class="btn btn-ghost" title="Prototype only" @click="closeCampaign(camp.id); tab('outcome')">
          ⚙ Simulate worker close
        </button>
      </header>
      <nav class="tabs">
        <button :class="{ on: screen.tab === 'overview' }" @click="tab('overview')">
          Overview
        </button>
        <button :class="{ on: screen.tab === 'bids' }" @click="tab('bids')">
          Bids ({{ bidsFor(camp.id).length }})
        </button>
        <button :class="{ on: screen.tab === 'outcome' }" @click="tab('outcome')">
          {{ camp.status === 'closed' ? 'Winners' : 'Projection' }}
        </button>
      </nav>
      <CampaignTerms v-if="screen.tab === 'overview'" :campaign="camp" />
      <BidsTable v-else-if="screen.tab === 'bids'" :campaign="camp" />
      <OutcomeSummary v-else :campaign="camp" />
    </section>
  </div>
</template>

<style scoped>
.a, .stack { display: grid; gap: var(--space-md); }
.row { display: flex; justify-content: space-between; align-items: center; }
.tabs { display: flex; gap: var(--space-sm); border-bottom: 1px solid var(--color-border-subtle); }
.tabs button { padding: var(--space-xs) var(--space-sm); border: 0; border-bottom: 2px solid transparent; background: none; color: inherit; cursor: pointer; }
.tabs .on { border-bottom-color: var(--color-accent-default); font-weight: var(--font-weight-semibold); }
table { inline-size: 100%; border-collapse: collapse; }
th, td { padding: var(--space-xs) var(--space-sm); text-align: start; border-bottom: 1px solid var(--color-border-subtle); }
tbody tr { cursor: pointer; }
tbody tr:hover { background: var(--color-bg-surface-hover); }
.back { justify-self: start; }
</style>
