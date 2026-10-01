<script setup lang="ts">
// PROTOTYPE (#22) — Variant C: lifecycle board (To bid | Waiting | Decided); a card opens one modal per campaign.
import { computed, ref } from 'vue'
import BidComposer from './BidComposer.vue'
import BidStatus from './BidStatus.vue'
import CampaignBrief from './CampaignBrief.vue'
import Factors from './Factors.vue'
import { db, matched, me, myBid, relevance, timeLeft, usd } from './fixtures.ts'

const cr = me()
const toBid = computed(() => matched())
const mine = computed(() => db.bids.filter(b => b.creatorId === 'me').map(b => ({ bid: b, campaign: db.campaigns.find(c => c.id === b.campaignId)! })))
const waiting = computed(() => mine.value.filter(m => m.bid.status === 'pending'))
const decided = computed(() => mine.value.filter(m => m.bid.status !== 'pending'))
const dlg = ref<HTMLDialogElement>()
const openId = ref<string | null>(null)
const campaign = computed(() => db.campaigns.find(c => c.id === openId.value))
const bid = computed(() => (openId.value ? myBid(openId.value) : undefined))
const earned = computed(() => decided.value.filter(m => m.bid.status === 'won').reduce((s, m) => s + m.bid.feeCents, 0))

function open(id: string) {
  openId.value = id
  dlg.value?.showModal()
}
</script>

<template>
  <div class="c">
    <header class="kpis">
      <div><strong>{{ toBid.length }}</strong> to bid</div>
      <div><strong>{{ waiting.length }}</strong> waiting</div>
      <div><strong>{{ decided.filter(d => d.bid.status === 'won').length }}/{{ decided.length }}</strong> won</div>
      <div><strong>{{ usd(earned) }}</strong> won in Fees</div>
    </header>
    <div class="board">
      <section>
        <h2>To bid</h2>
        <button v-for="m in toBid" :key="m.campaign.id" class="tile" @click="open(m.campaign.id)">
          <strong>{{ m.campaign.title }}</strong>
          <span class="muted">{{ m.campaign.advertiser }}</span>
          <span>Relevance {{ m.relevance.value }} · suggest {{ usd(m.quote.suggested) }}</span>
          <span class="muted">{{ timeLeft(m.campaign.biddingDeadline) }}</span>
        </button>
      </section>
      <section>
        <h2>Waiting for close</h2>
        <button v-for="m in waiting" :key="m.bid.id" class="tile" @click="open(m.campaign.id)">
          <strong>{{ m.campaign.title }}</strong>
          <span>Your Fee {{ usd(m.bid.feeCents) }} · eCPM {{ usd(m.bid.effectiveCpmCents) }} / {{ usd(m.campaign.targetCpmCents) }}</span>
          <span class="muted">{{ timeLeft(m.campaign.biddingDeadline) }}</span>
        </button>
      </section>
      <section>
        <h2>Decided</h2>
        <button v-for="m in decided" :key="m.bid.id" class="tile" :class="m.bid.status" @click="open(m.campaign.id)">
          <strong>{{ m.campaign.title }}</strong>
          <span>{{ m.bid.status.toUpperCase() }} · Rank #{{ m.bid.rank }}</span>
          <span class="muted">{{ usd(m.bid.feeCents) }}</span>
        </button>
      </section>
    </div>
    <dialog ref="dlg" @close="openId = null">
      <div v-if="campaign" class="modal">
        <header class="mh">
          <h1>{{ campaign.title }}</h1>
          <button class="btn btn-ghost" @click="dlg?.close()">
            Close
          </button>
        </header>
        <BidStatus v-if="bid" :bid="bid" :campaign="campaign" />
        <CampaignBrief :campaign="campaign" />
        <template v-if="!bid">
          <Factors v-bind="{ factors: relevance(cr, campaign).factors, total: relevance(cr, campaign).value }" label="Relevance" />
          <BidComposer :campaign="campaign" />
        </template>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.c { display: grid; gap: var(--space-md); }
.kpis { display: flex; gap: var(--space-xl); }
.kpis strong { font-size: var(--font-size-xl); }
.board { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md); align-items: start; }
section { display: grid; gap: var(--space-sm); padding: var(--space-sm); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
h2 { font-size: var(--font-size-sm); text-transform: uppercase; }
.tile { display: grid; gap: var(--space-2xs); padding: var(--space-sm); border: 1px solid var(--color-border-default); border-radius: var(--radius-md); background: var(--color-bg-canvas); color: inherit; text-align: start; cursor: pointer; }
.tile.won { border-color: var(--color-success-default); }
.tile.lost { border-color: var(--color-danger-border); }
dialog { inline-size: min(48rem, 95vw); padding: var(--space-lg); border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); background: var(--color-bg-surface); color: inherit; }
.modal { display: grid; gap: var(--space-md); }
.mh { display: flex; justify-content: space-between; align-items: center; }
</style>
