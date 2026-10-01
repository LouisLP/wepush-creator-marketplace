<script setup lang="ts">
import type { CreatorBid, CreatorCampaign } from '@wepush/contracts'
import { placeBid } from '@wepush/contracts'
import { computed, shallowRef, useId } from 'vue'
import { ApiError, call, feeRangeMessage, fieldErrors, messageFor } from '@/api'
import { formatCents, formatCount, formatVsTarget } from '@/lib/format.ts'

const props = defineProps<{ campaign: CreatorCampaign }>()
const emit = defineEmits<{ placed: [bid: CreatorBid], confirming: [boolean] }>()

const quote = computed(() => props.campaign.feeQuote)
const dollars = shallowRef<number | string>(quote.value.suggestedFeeCents / 100)
const feeCents = computed(() => Math.round(Number(dollars.value) * 100))
const inRange = computed(() => Number.isFinite(feeCents.value) && feeCents.value >= quote.value.minFeeCents && feeCents.value <= quote.value.maxFeeCents)
const effectiveCpm = computed(() => Math.round(feeCents.value * 1000 / quote.value.estimatedImpressions))

const vsTarget = computed(() => {
  const target = props.campaign.targetCpmCents
  const hint = effectiveCpm.value < target ? ': scores better' : effectiveCpm.value > target ? ': lower Score' : ''
  return formatVsTarget(effectiveCpm.value, target) + hint
})

const confirming = shallowRef(false)
const submitting = shallowRef(false)
const serverError = shallowRef<string>()
const feeError = computed(() => serverError.value ?? (inRange.value ? undefined : feeRangeMessage(quote.value.minFeeCents, quote.value.maxFeeCents)))
const errorId = useId()

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
    <dl class="quote">
      <div><dt>Estimated Impressions</dt><dd>{{ formatCount(quote.estimatedImpressions) }}</dd></div>
      <div><dt>Suggested Fee</dt><dd>{{ formatCents(quote.suggestedFeeCents) }}</dd></div>
      <div><dt>Fee Range</dt><dd>{{ formatCents(quote.minFeeCents) }} – {{ formatCents(quote.maxFeeCents) }}</dd></div>
    </dl>

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
    <p v-if="feeError" :id="errorId" class="field-error" role="alert">
      {{ feeError }}
    </p>
    <p v-else class="cpm">
      Effective CPM <strong>{{ formatCents(effectiveCpm) }}</strong> vs Target {{ formatCents(campaign.targetCpmCents) }}
      <span class="muted">— {{ vsTarget }}</span>
    </p>

    <p class="muted small">
      Bids are final and sealed: one per Campaign, no edits or withdrawal, and other Creators never see them.
      Winners are picked automatically at the Bidding Deadline by Score, within Budget.
    </p>

    <div v-if="confirming" class="confirm">
      <span>Final, can’t be changed. Place your Bid at <strong>{{ formatCents(feeCents) }}</strong>?</span>
      <button type="button" class="btn" :disabled="submitting" @click="submit">
        Confirm Bid
      </button>
      <button type="button" class="btn btn-ghost" :disabled="submitting" @click="setConfirming(false)">
        Back
      </button>
    </div>
    <button v-else type="submit" class="btn place" :disabled="!inRange">
      Place Bid at {{ inRange ? formatCents(feeCents) : '…' }}
    </button>
  </form>
</template>

<style scoped>
.composer {
  display: grid;
  gap: var(--space-sm);
}

.quote {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--space-md);
}

dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

dd {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

input[type="range"] {
  inline-size: 100%;
  accent-color: var(--color-accent-default);
}

.cpm strong {
  font-variant-numeric: tabular-nums;
}

.small {
  font-size: var(--font-size-sm);
}

.place {
  justify-self: start;
}

.confirm {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}
</style>
