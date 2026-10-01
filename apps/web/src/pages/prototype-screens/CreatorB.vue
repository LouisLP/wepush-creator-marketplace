<script setup lang="ts">
// PROTOTYPE (#22) — Variant B: master–detail. One campaign pane that morphs Review → Bid → Track → Outcome.
import { computed, ref } from 'vue'
import BidComposer from './BidComposer.vue'
import BidStatus from './BidStatus.vue'
import CampaignBrief from './CampaignBrief.vue'
import Factors from './Factors.vue'
import { db, matched, me, myBid, relevance, timeLeft, usd } from './fixtures.ts'

const cr = me()
const list = computed(() => matched())
const mine = computed(() => db.bids.filter(b => b.creatorId === 'me').map(b => ({ bid: b, campaign: db.campaigns.find(c => c.id === b.campaignId)! })))
const selected = ref<string | null>(list.value[0]?.campaign.id ?? null)
const campaign = computed(() => db.campaigns.find(c => c.id === selected.value))
const bid = computed(() => (selected.value ? myBid(selected.value) : undefined))
const bidding = ref(false)
</script>

<template>
  <div class="b">
    <aside>
      <h2>Matched <small class="muted">by Relevance</small></h2>
      <ul>
        <li v-for="m in list" :key="m.campaign.id" :class="{ on: selected === m.campaign.id }" @click="selected = m.campaign.id; bidding = false">
          <span class="rel">{{ m.relevance.value }}</span>
          <span><strong>{{ m.campaign.title }}</strong><br><small class="muted">{{ usd(m.quote.suggested) }} suggested · {{ timeLeft(m.campaign.biddingDeadline) }}</small></span>
        </li>
      </ul>
      <h2>My Bids</h2>
      <ul>
        <li v-for="m in mine" :key="m.bid.id" :class="{ on: selected === m.campaign.id }" @click="selected = m.campaign.id; bidding = false">
          <span class="dot" :class="m.bid.status" />
          <span><strong>{{ m.campaign.title }}</strong><br><small class="muted">{{ usd(m.bid.feeCents) }} · {{ m.bid.status }}{{ m.bid.rank ? ` · #${m.bid.rank}` : '' }}</small></span>
        </li>
      </ul>
    </aside>
    <article v-if="campaign" class="pane">
      <h1>{{ campaign.title }}</h1>
      <ol class="steps">
        <li class="done">
          Review
        </li>
        <li :class="{ done: bid, now: !bid }">
          Bid
        </li>
        <li :class="{ done: bid && bid.status !== 'pending', now: bid?.status === 'pending' }">
          Track
        </li>
        <li :class="{ now: bid && bid.status !== 'pending' }">
          Outcome
        </li>
      </ol>
      <section v-if="bid" class="card">
        <BidStatus :bid="bid" :campaign="campaign" />
      </section>
      <CampaignBrief :campaign="campaign" />
      <template v-if="!bid">
        <div class="card">
          <Factors v-bind="{ factors: relevance(cr, campaign).factors, total: relevance(cr, campaign).value }" label="Relevance" />
        </div>
        <div class="card">
          <BidComposer v-if="bidding" :campaign="campaign" @placed="bidding = false" />
          <button v-else class="btn" @click="bidding = true">
            Bid on this Campaign
          </button>
        </div>
      </template>
    </article>
  </div>
</template>

<style scoped>
.b { display: grid; grid-template-columns: 20rem 1fr; gap: var(--space-lg); align-items: start; }
aside { position: sticky; top: var(--space-md); display: grid; gap: var(--space-xs); }
aside h2 { font-size: var(--font-size-sm); text-transform: uppercase; }
ul { display: grid; gap: 2px; padding: 0; list-style: none; }
li { display: flex; gap: var(--space-sm); align-items: center; padding: var(--space-xs) var(--space-sm); border-radius: var(--radius-md); cursor: pointer; }
li:hover, li.on { background: var(--color-bg-surface-hover); }
.rel { min-inline-size: 2.2rem; font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); text-align: center; }
.dot { inline-size: 0.6rem; block-size: 0.6rem; border-radius: 50%; background: var(--color-text-muted); }
.dot.won { background: var(--color-success-default); }
.dot.lost { background: var(--color-danger-default); }
.pane { display: grid; gap: var(--space-md); }
.steps { display: flex; gap: var(--space-md); padding: 0; list-style: none; font-size: var(--font-size-sm); color: var(--color-text-muted); }
.steps .done { color: var(--color-success-subtle-fg); }
.steps .now { color: var(--color-text-primary); font-weight: var(--font-weight-bold); text-decoration: underline; }
</style>
