<script setup lang="ts">
// PROTOTYPE (#22) — Fee Quote + fee input with live Effective CPM.
import type { Campaign } from './fixtures.ts'
import { computed, ref } from 'vue'
import { count, effectiveCpm, feeQuote, me, placeBid, usd } from './fixtures.ts'

const props = defineProps<{ campaign: Campaign }>()
const emit = defineEmits<{ placed: [] }>()
const q = feeQuote(me(), props.campaign)
const dollars = ref(q.suggested / 100)
const fee = computed(() => Math.round(dollars.value * 100))
const eff = computed(() => effectiveCpm(fee.value, q.impressions))
const inRange = computed(() => fee.value >= q.min && fee.value <= q.max)
const vsTarget = computed(() => eff.value / props.campaign.targetCpmCents)
const confirming = ref(false)

function submit() {
  placeBid(props.campaign.id, fee.value)
  emit('placed')
}
</script>

<template>
  <div class="composer">
    <dl class="quote">
      <div><dt>Estimated Impressions</dt><dd>{{ count(q.impressions) }}</dd></div>
      <div><dt>Suggested Fee</dt><dd>{{ usd(q.suggested) }}</dd></div>
      <div><dt>Fee Range</dt><dd>{{ usd(q.min) }} – {{ usd(q.max) }}</dd></div>
    </dl>
    <label class="field">
      <span>Your Fee (USD)</span>
      <input v-model.number="dollars" type="number" :min="q.min / 100" :max="q.max / 100" step="1">
    </label>
    <input v-model.number="dollars" type="range" :min="q.min / 100" :max="q.max / 100" step="1" aria-label="Fee">
    <p :class="inRange ? 'muted' : 'field-error'">
      Effective CPM <strong>{{ usd(eff) }}</strong> vs Target {{ usd(campaign.targetCpmCents) }}
      <span v-if="inRange">— {{ vsTarget <= 1 ? 'at or under target: scores well' : `${Math.round((vsTarget - 1) * 100)}% over target: lower Score` }}</span>
      <span v-else>— outside the Fee Range, can't be placed</span>
    </p>
    <p class="muted small">
      Bids are sealed and final: one per Campaign, no edits or withdrawal. Winners are picked automatically at the deadline by Score, within Budget.
    </p>
    <button v-if="!confirming" class="btn" :disabled="!inRange" @click="confirming = true">
      Place Bid at {{ usd(fee) }}
    </button>
    <div v-else class="confirm">
      <span>Final — can't be changed. Place Bid at {{ usd(fee) }}?</span>
      <button class="btn" @click="submit">
        Confirm
      </button>
      <button class="btn btn-ghost" @click="confirming = false">
        Back
      </button>
    </div>
  </div>
</template>

<style scoped>
.composer { display: grid; gap: var(--space-sm); }
.quote { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm); }
dt { color: var(--color-text-muted); font-size: var(--font-size-sm); }
dd { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
.small { font-size: var(--font-size-sm); }
.confirm { display: flex; gap: var(--space-sm); align-items: center; }
</style>
