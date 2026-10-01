<script setup lang="ts">
// PROTOTYPE (#22) — Variant B: master–detail; one scrolling campaign page (outcome on top once closed, then bids, then terms).
import { computed, ref } from 'vue'
import BidsTable from './BidsTable.vue'
import CampaignForm from './CampaignForm.vue'
import CampaignTerms from './CampaignTerms.vue'
import { bidsFor, closeCampaign, db, myCampaigns, timeLeft, usd } from './fixtures.ts'
import OutcomeSummary from './OutcomeSummary.vue'

const list = computed(() => myCampaigns())
const selected = ref<string | 'new'>(list.value[0]!.id)
const camp = computed(() => db.campaigns.find(c => c.id === selected.value))
</script>

<template>
  <div class="b">
    <aside>
      <button class="btn" @click="selected = 'new'">
        + New Campaign
      </button>
      <h2>Open</h2>
      <ul>
        <li v-for="c in list.filter(c => c.status === 'open')" :key="c.id" :class="{ on: selected === c.id }" @click="selected = c.id">
          <strong>{{ c.title }}</strong><small class="muted">{{ bidsFor(c.id).length }} Bids · {{ timeLeft(c.biddingDeadline) }}</small>
        </li>
      </ul>
      <h2>Closed</h2>
      <ul>
        <li v-for="c in list.filter(c => c.status === 'closed')" :key="c.id" :class="{ on: selected === c.id }" @click="selected = c.id">
          <strong>{{ c.title }}</strong><small class="muted">Spent {{ usd(c.spentCents ?? 0) }} / {{ usd(c.budgetCents) }}</small>
        </li>
      </ul>
    </aside>
    <article v-if="selected === 'new'" class="pane">
      <h1>New Campaign</h1>
      <CampaignForm @created="id => selected = id" />
    </article>
    <article v-else-if="camp" class="pane">
      <header class="row">
        <h1>{{ camp.title }}</h1>
        <button v-if="camp.status === 'open'" class="btn btn-ghost" @click="closeCampaign(camp.id)">
          ⚙ Simulate worker close
        </button>
      </header>
      <section class="card">
        <h2>{{ camp.status === 'closed' ? 'Winners' : 'If it closed now' }}</h2>
        <OutcomeSummary :campaign="camp" />
      </section>
      <section class="card">
        <h2>Bids</h2>
        <BidsTable :campaign="camp" />
      </section>
      <section class="card">
        <h2>Terms</h2>
        <CampaignTerms :campaign="camp" />
      </section>
    </article>
  </div>
</template>

<style scoped>
.b { display: grid; grid-template-columns: 17rem 1fr; gap: var(--space-lg); align-items: start; }
aside { position: sticky; top: var(--space-md); display: grid; gap: var(--space-xs); }
aside h2 { font-size: var(--font-size-sm); text-transform: uppercase; }
ul { display: grid; gap: 2px; padding: 0; list-style: none; }
li { display: grid; padding: var(--space-xs) var(--space-sm); border-radius: var(--radius-md); cursor: pointer; }
li:hover, li.on { background: var(--color-bg-surface-hover); }
.pane { display: grid; gap: var(--space-md); }
.pane h2 { font-size: var(--font-size-md); margin-block-end: var(--space-sm); }
.row { display: flex; justify-content: space-between; align-items: center; }
</style>
