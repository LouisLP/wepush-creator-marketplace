<script setup lang="ts">
// PROTOTYPE (#22) — Variant A: one page per step (5 screens).
import { computed, ref } from 'vue'
import BidComposer from './BidComposer.vue'
import BidStatus from './BidStatus.vue'
import CampaignBrief from './CampaignBrief.vue'
import Factors from './Factors.vue'
import { count, db, matched, me, pct, platformLabel, relevance, timeLeft, usd } from './fixtures.ts'

type Screen = { name: 'matched' } | { name: 'campaign', id: string } | { name: 'bid', id: string } | { name: 'bids' } | { name: 'bidDetail', id: string }
const screen = ref<Screen>({ name: 'matched' })
const cr = me()
const list = computed(() => matched())
const mine = computed(() => db.bids.filter(b => b.creatorId === 'me').map(b => ({ bid: b, campaign: db.campaigns.find(c => c.id === b.campaignId)! })))
const camp = (id: string) => db.campaigns.find(c => c.id === id)!
</script>

<template>
  <div class="a">
    <nav class="tabs">
      <button :class="{ on: screen.name === 'matched' || screen.name === 'campaign' || screen.name === 'bid' }" @click="screen = { name: 'matched' }">
        Matched Campaigns
      </button>
      <button :class="{ on: screen.name === 'bids' || screen.name === 'bidDetail' }" @click="screen = { name: 'bids' }">
        My Bids ({{ mine.length }})
      </button>
      <span class="muted profile">{{ cr.handle }} · {{ platformLabel(cr.platform) }} · {{ cr.category }} · {{ count(cr.followers) }} · {{ pct(cr.engagementRate) }}</span>
    </nav>

    <section v-if="screen.name === 'matched'">
      <h1>Matched Campaigns</h1>
      <p class="muted">
        Campaigns whose every Requirement your profile meets, by Relevance (payout vs platform CPM range, and whether the Budget fits your Fee).
      </p>
      <table>
        <thead><tr><th>Campaign</th><th>Relevance</th><th>Target CPM</th><th>Suggested Fee</th><th>Budget</th><th>Closes</th></tr></thead>
        <tbody>
          <tr v-for="m in list" :key="m.campaign.id" @click="screen = { name: 'campaign', id: m.campaign.id }">
            <td><strong>{{ m.campaign.title }}</strong><br><small class="muted">{{ m.campaign.advertiser }}</small></td>
            <td>{{ m.relevance.value }}</td>
            <td>{{ usd(m.campaign.targetCpmCents) }}</td>
            <td>{{ usd(m.quote.suggested) }}</td>
            <td>{{ usd(m.campaign.budgetCents) }}</td>
            <td>{{ timeLeft(m.campaign.biddingDeadline) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-else-if="screen.name === 'campaign'" class="stack">
      <button class="btn btn-ghost back" @click="screen = { name: 'matched' }">
        ← Matched
      </button>
      <h1>{{ camp(screen.id).title }}</h1>
      <CampaignBrief :campaign="camp(screen.id)" />
      <div class="card">
        <Factors v-bind="{ factors: relevance(cr, camp(screen.id)).factors, total: relevance(cr, camp(screen.id)).value }" label="Relevance" />
      </div>
      <button class="btn" @click="screen = { name: 'bid', id: (screen as any).id }">
        Bid on this Campaign →
      </button>
    </section>

    <section v-else-if="screen.name === 'bid'" class="stack">
      <button class="btn btn-ghost back" @click="screen = { name: 'campaign', id: (screen as any).id }">
        ← {{ camp(screen.id).title }}
      </button>
      <h1>Place Bid</h1>
      <div class="card">
        <BidComposer :campaign="camp(screen.id)" @placed="screen = { name: 'bidDetail', id: (screen as any).id }" />
      </div>
    </section>

    <section v-else-if="screen.name === 'bids'">
      <h1>My Bids</h1>
      <table>
        <thead><tr><th>Campaign</th><th>Fee</th><th>Status</th><th>Rank</th><th>Closes / closed</th></tr></thead>
        <tbody>
          <tr v-for="m in mine" :key="m.bid.id" @click="screen = { name: 'bidDetail', id: m.campaign.id }">
            <td>{{ m.campaign.title }}</td>
            <td>{{ usd(m.bid.feeCents) }}</td>
            <td>{{ m.bid.status }}</td>
            <td>{{ m.bid.rank ? `#${m.bid.rank}` : '—' }}</td>
            <td>{{ m.campaign.status === 'open' ? timeLeft(m.campaign.biddingDeadline) : 'closed' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-else-if="screen.name === 'bidDetail'" class="stack">
      <button class="btn btn-ghost back" @click="screen = { name: 'bids' }">
        ← My Bids
      </button>
      <h1>{{ camp(screen.id).title }} — your Bid</h1>
      <div class="card">
        <BidStatus :bid="db.bids.find(b => b.campaignId === (screen as any).id && b.creatorId === 'me')!" :campaign="camp(screen.id)" />
      </div>
      <details>
        <summary>Campaign brief</summary>
        <CampaignBrief :campaign="camp(screen.id)" />
      </details>
    </section>
  </div>
</template>

<style scoped>
.a, .stack { display: grid; gap: var(--space-md); }
.tabs { display: flex; gap: var(--space-sm); align-items: center; border-bottom: 1px solid var(--color-border-subtle); }
.tabs button { padding: var(--space-xs) var(--space-sm); border: 0; border-bottom: 2px solid transparent; background: none; color: inherit; cursor: pointer; }
.tabs .on { border-bottom-color: var(--color-accent-default); font-weight: var(--font-weight-semibold); }
.profile { margin-inline-start: auto; font-size: var(--font-size-sm); }
table { inline-size: 100%; border-collapse: collapse; }
th, td { padding: var(--space-xs) var(--space-sm); text-align: start; border-bottom: 1px solid var(--color-border-subtle); }
tbody tr { cursor: pointer; }
tbody tr:hover { background: var(--color-bg-surface-hover); }
.back { justify-self: start; }
</style>
