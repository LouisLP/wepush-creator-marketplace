<script setup lang="ts">
// PROTOTYPE (#22) — Create Campaign with live guidance (CPM range, matching-creator reach, Posts the Budget buys).
import type { Platform } from './fixtures.ts'
import { computed, reactive } from 'vue'
import { count, CPM_RANGE, createCampaign, db, feeQuote, meetsRequirements, platformLabel, usd } from './fixtures.ts'

const emit = defineEmits<{ created: [id: string] }>()
const CATS = ['beauty', 'fashion', 'fitness', 'food', 'gaming', 'tech', 'travel', 'lifestyle', 'finance', 'parenting']
const f = reactive({ title: '', brief: '', platform: 'instagram' as Platform, categories: ['food'], minFollowers: 10_000, minEr: '' as number | '', budget: 3000, targetCpm: 12, hours: 72 })

const draft = computed(() => ({
  title: f.title || 'Untitled',
  brief: f.brief,
  platform: f.platform,
  categories: f.categories,
  minFollowers: f.minFollowers,
  minEngagementRate: f.minEr === '' ? null : f.minEr / 100,
  budgetCents: Math.round(f.budget * 100),
  targetCpmCents: Math.round(f.targetCpm * 100),
  biddingDeadline: new Date(Date.now() + f.hours * 3600_000).toISOString(),
}))
const range = computed(() => CPM_RANGE[f.platform])
const pool = computed(() => db.creators.filter(c => meetsRequirements(c.followers, c.engagementRate, c.category, c.platform, { ...draft.value, id: '', advertiser: '', createdAt: '', status: 'open', spentCents: null, closedAt: null }).length === 0))
const fees = computed(() => pool.value.map(c => feeQuote(c, { ...draft.value, id: '', advertiser: '', createdAt: '', status: 'open', spentCents: null, closedAt: null }).suggested).sort((a, b) => a - b))
const median = computed(() => fees.value[Math.floor(fees.value.length / 2)] ?? 0)

function submit() {
  emit('created', createCampaign(draft.value))
}
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <div class="cols">
      <fieldset>
        <legend>What</legend>
        <label class="field"><span>Title</span><input v-model="f.title" required></label>
        <label class="field"><span>Brief (shown to Creators)</span><textarea v-model="f.brief" rows="4" required /></label>
      </fieldset>
      <fieldset>
        <legend>Requirements — who can see it</legend>
        <label class="field"><span>Platform</span>
          <select v-model="f.platform"><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select>
        </label>
        <div class="field">
          <span>Categories</span>
          <div class="chips">
            <label v-for="c in CATS" :key="c"><input v-model="f.categories" type="checkbox" :value="c"> {{ c }}</label>
          </div>
        </div>
        <label class="field"><span>Min followers</span><input v-model.number="f.minFollowers" type="number" min="0"></label>
        <label class="field"><span>Min engagement % (optional)</span><input v-model="f.minEr" type="number" step="0.1" min="0"></label>
      </fieldset>
      <fieldset>
        <legend>Money & time</legend>
        <label class="field"><span>Budget (USD)</span><input v-model.number="f.budget" type="number" min="1"></label>
        <label class="field"><span>Target CPM (USD)</span><input v-model.number="f.targetCpm" type="number" step="0.5" min="0.5">
          <small :class="draft.targetCpmCents < range[0] || draft.targetCpmCents > range[1] ? 'field-error' : 'muted'">
            Typical {{ platformLabel(f.platform) }} range {{ usd(range[0]) }}–{{ usd(range[1]) }}. Lower = cheaper views but Creators rank you lower.
          </small>
        </label>
        <label class="field"><span>Bidding Deadline (hours from now)</span><input v-model.number="f.hours" type="number" min="1"></label>
      </fieldset>
    </div>
    <aside class="card preview">
      <strong>Preview</strong>
      <p>{{ pool.length }} of {{ db.creators.length }} Creators match these Requirements.</p>
      <p v-if="pool.length">
        Their Suggested Fees: {{ usd(fees[0]!) }} – {{ usd(fees.at(-1)!) }}, median {{ usd(median) }} → Budget buys ~{{ Math.floor(draft.budgetCents / Math.max(median, 1)) }} Posts at Target CPM.
      </p>
      <p v-else class="field-error">
        No Creators match — loosen the Requirements.
      </p>
      <p class="muted">
        Terms can't be edited after creation. Winners are picked automatically at the deadline; you can't veto. Creators see Brief, Requirements, Budget, Target CPM, deadline.
      </p>
      <p class="muted">
        Reach: {{ count(pool.reduce((s, c) => s + c.followers, 0)) }} combined followers.
      </p>
      <button class="btn" type="submit">
        Create Campaign
      </button>
    </aside>
  </form>
</template>

<style scoped>
.form { display: grid; grid-template-columns: 1fr 18rem; gap: var(--space-lg); align-items: start; }
.cols { display: grid; gap: var(--space-md); }
fieldset { display: grid; gap: var(--space-sm); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); padding: var(--space-md); }
textarea { padding: var(--space-xs); border: 1px solid var(--color-border-default); border-radius: var(--radius-md); background: var(--color-bg-canvas); color: inherit; }
.chips { display: flex; flex-wrap: wrap; gap: var(--space-xs) var(--space-md); font-size: var(--font-size-sm); }
.preview { position: sticky; top: var(--space-md); display: grid; gap: var(--space-sm); }
</style>
