<script setup lang="ts">
import type { CreatorBid, CreatorCampaign } from '@wepush/contracts'
import { placeBid } from '@wepush/contracts'
import { computed, shallowRef, useId } from 'vue'
import IconInfo from '~icons/lucide/info'
import IconLock from '~icons/lucide/lock'
import { ApiError, call, feeRangeMessage, fieldErrors, messageFor } from '@/api'
import AppTooltip from '@/components/kit/AppTooltip.vue'
import { formatCents, formatCount } from '@/lib/format.ts'
import CpmVsTargetBadge from './CpmVsTargetBadge.vue'

const props = defineProps<{ campaign: CreatorCampaign }>()
const emit = defineEmits<{ placed: [bid: CreatorBid], confirming: [boolean] }>()

const RULES = 'Bids are final and sealed: one per Campaign, no edits or withdrawal, and other Creators never see them. Winners are picked automatically at the Bidding Deadline by Score, within Budget.'

const quote = computed(() => props.campaign.feeQuote)
const dollars = shallowRef<number | string>(quote.value.suggestedFeeCents / 100)
const feeCents = computed(() => Math.round(Number(dollars.value) * 100))
const inRange = computed(() => Number.isFinite(feeCents.value) && feeCents.value >= quote.value.minFeeCents && feeCents.value <= quote.value.maxFeeCents)
const effectiveCpm = computed(() => Math.round(feeCents.value * 1000 / quote.value.estimatedImpressions))

const confirming = shallowRef(false)
const submitting = shallowRef(false)
const serverError = shallowRef<string>()
const feeError = computed(() => serverError.value ?? (inRange.value ? undefined : feeRangeMessage(quote.value.minFeeCents, quote.value.maxFeeCents)))
const errorId = useId()
const rulesId = useId()

function setConfirming(value: boolean) {
  confirming.value = value
  emit('confirming', value)
}

function onInput() {
  serverError.value = undefined
  if (confirming.value)
    setConfirming(false)
}

async function submit() {
  submitting.value = true
  try {
    emit('placed', await call(placeBid, { params: { id: props.campaign.id }, body: { feeCents: feeCents.value } }))
  }
  catch (e) {
    serverError.value = e instanceof ApiError ? (fieldErrors(e).feeCents ?? messageFor(e)) : 'Something went wrong.'
    setConfirming(false)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="composer" @submit.prevent="setConfirming(true)">
    <p class="quote">
      <span>{{ formatCount(quote.estimatedImpressions) }} Est. Impressions</span>
      <span>Suggested <strong>{{ formatCents(quote.suggestedFeeCents) }}</strong></span>
      <span class="muted">Range {{ formatCents(quote.minFeeCents) }} – {{ formatCents(quote.maxFeeCents) }}</span>
    </p>

    <div class="fee">
      <label class="field">
        <span>Your Fee (USD)</span>
        <input
          v-model="dollars"
          name="fee"
          type="number"
          inputmode="decimal"
          :min="quote.minFeeCents / 100"
          :max="quote.maxFeeCents / 100"
          step="0.01"
          required
          :aria-invalid="!!feeError"
          :aria-describedby="feeError ? errorId : undefined"
          @input="onInput"
        >
      </label>
      <input
        v-model.number="dollars"
        type="range"
        :min="quote.minFeeCents / 100"
        :max="quote.maxFeeCents / 100"
        step="1"
        aria-label="Fee"
        @input="onInput"
      >
    </div>

    <p v-if="feeError" :id="errorId" class="field-error" role="alert">
      {{ feeError }}
    </p>
    <p v-else class="cpm">
      Effective CPM <strong>{{ formatCents(effectiveCpm) }}</strong>
      <span class="muted">vs Target {{ formatCents(campaign.targetCpmCents) }}</span>
      <CpmVsTargetBadge :cpm-cents="effectiveCpm" :target-cpm-cents="campaign.targetCpmCents" />
    </p>

    <div v-if="confirming" class="confirm">
      <span><IconLock aria-hidden="true" /> Final, can’t be changed. Place your Bid at <strong>{{ formatCents(feeCents) }}</strong>?</span>
      <button type="button" class="btn" :disabled="submitting" @click="submit">
        Confirm Bid
      </button>
      <button type="button" class="btn btn-ghost" :disabled="submitting" @click="setConfirming(false)">
        Back
      </button>
    </div>
    <div v-else class="actions">
      <button type="submit" class="btn" :disabled="!inRange">
        Place Bid at {{ inRange ? formatCents(feeCents) : '…' }}
      </button>
      <AppTooltip :content="RULES">
        <button type="button" class="rules" aria-label="Bid rules" :aria-describedby="rulesId">
          <IconInfo aria-hidden="true" />
        </button>
      </AppTooltip>
      <span :id="rulesId" class="visually-hidden">{{ RULES }}</span>
    </div>
  </form>
</template>

<style scoped>
.composer {
  display: grid;
  gap: var(--space-md);
}

.quote,
.cpm,
.actions,
.confirm {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-md);
}

.quote {
  font-size: var(--font-size-sm);
}

.cpm {
  gap: var(--space-xs);
}

.fee {
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr);
  gap: var(--space-md);
  align-items: end;
}

.fee input[type="range"] {
  inline-size: 100%;
  block-size: 2.5rem;
  accent-color: var(--color-accent-default);
}

strong {
  font-variant-numeric: tabular-nums;
}

.confirm {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface-raised);
}

.confirm svg {
  vertical-align: -0.125em;
}

.rules {
  display: inline-grid;
  place-items: center;
  padding: var(--space-2xs);
  border: 0;
  border-radius: var(--radius-full);
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  cursor: help;
}

.rules:hover {
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.rules:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
