<script setup lang="ts">
// PROTOTYPE (#52) — slim Bid composer: one fee control, CPM-vs-Target chip, rules behind an info icon. Stubbed submit.
import type { CreatorCampaign } from './fixtures.ts'
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { count, usd, usdShort, vsTarget } from './fixtures.ts'
import PBadge from './PBadge.vue'

const props = defineProps<{ campaign: CreatorCampaign, compact?: boolean }>()
const q = props.campaign.quote
const dollars = ref(q.suggestedCents / 100)
const confirming = ref(false)
const placed = ref(false)
const fee = computed(() => Math.round(dollars.value * 100))
const inRange = computed(() => fee.value >= q.minCents && fee.value <= q.maxCents)
const cpm = computed(() => Math.round((fee.value * 1000) / q.impressions))
const delta = computed(() => vsTarget(cpm.value, props.campaign.targetCpmCents))
</script>

<template>
  <form class="composer" @submit.prevent="confirming = true">
    <p class="quote p-small">
      <span title="Est. Impressions"><Icon icon="lucide:eye" aria-label="Est. Impressions" /> {{ count(q.impressions) }}</span>
      <span>Suggested <strong>{{ usdShort(q.suggestedCents) }}</strong></span>
      <span class="muted">Range {{ usdShort(q.minCents) }}–{{ usdShort(q.maxCents) }}</span>
    </p>
    <div class="fee">
      <label class="field">
        <span class="visually-hidden">Your Fee (USD)</span>
        <span class="money"><span aria-hidden="true">$</span><input v-model.number="dollars" type="number" :min="q.minCents / 100" :max="q.maxCents / 100" step="1" aria-label="Your Fee (USD)"></span>
      </label>
      <input v-model.number="dollars" type="range" :min="q.minCents / 100" :max="q.maxCents / 100" step="1" aria-label="Fee">
    </div>
    <p class="p-row p-small">
      <span v-if="!inRange" class="field-error">Outside the Fee Range</span>
      <template v-else>
        Effective CPM <strong class="p-num">{{ usd(cpm) }}</strong>
        <PBadge :tone="delta.tone" :icon="delta.icon">{{ delta.label }} vs Target</PBadge>
      </template>
    </p>
    <p v-if="placed" class="p-row">
      <PBadge tone="neutral" icon="lucide:hourglass">Placed (stub)</PBadge>
    </p>
    <div v-else-if="confirming" class="confirm p-row">
      <span class="p-small"><Icon icon="lucide:lock" aria-hidden="true" /> Final & sealed. Bid {{ usdShort(fee) }}?</span>
      <button type="button" class="btn" @click="placed = true">
        Confirm
      </button>
      <button type="button" class="btn btn-ghost" @click="confirming = false">
        Back
      </button>
    </div>
    <div v-else class="p-row">
      <button type="submit" class="btn" :disabled="!inRange">
        Place Bid · {{ usdShort(fee) }}
      </button>
      <span v-if="!compact" class="muted p-xs" title="One Bid per Campaign, no edits or withdrawal, sealed from other Creators. Winners picked at the Bidding Deadline by Score, within Budget.">
        <Icon icon="lucide:info" aria-hidden="true" /> One sealed Bid, final
      </span>
    </div>
  </form>
</template>

<style scoped>
.composer { display: grid; gap: var(--space-sm); }
.quote { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: center; }
.fee { display: grid; grid-template-columns: 7rem 1fr; gap: var(--space-md); align-items: center; }
.money { display: flex; align-items: center; gap: var(--space-2xs); font-size: var(--font-size-lg); }
.money input { inline-size: 100%; }
.confirm { padding: var(--space-xs) var(--space-sm); border-radius: var(--radius-md); background: var(--color-bg-surface-raised); }
</style>
