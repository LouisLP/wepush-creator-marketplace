<script setup lang="ts">
import type { CreatorBid, CreatorCampaign } from '@wepush/contracts'
import { placeBid } from '@wepush/contracts'
import { computed, shallowRef, useId, watch } from 'vue'
import IconLock from '~icons/lucide/lock'
import { ApiError, call, feeRangeMessage, fieldErrors, messageFor } from '@/api'
import AppField from '@/components/kit/AppField.vue'
import AppNumberField from '@/components/kit/AppNumberField.vue'
import AppSlider from '@/components/kit/AppSlider.vue'
import { formatCents, formatCount } from '@/lib/format.ts'
import CpmVsTargetBadge from './CpmVsTargetBadge.vue'

const props = defineProps<{ campaign: CreatorCampaign }>()
const emit = defineEmits<{ placed: [bid: CreatorBid], confirming: [boolean] }>()

const quote = computed(() => props.campaign.feeQuote)
const dollars = shallowRef<number | undefined>(quote.value.suggestedFeeCents / 100)
const feeCents = computed(() => (dollars.value === undefined ? Number.NaN : Math.round(dollars.value * 100)))
const inRange = computed(() => Number.isFinite(feeCents.value) && feeCents.value >= quote.value.minFeeCents && feeCents.value <= quote.value.maxFeeCents)
const effectiveCpm = computed(() => Math.round(feeCents.value * 1000 / quote.value.estimatedImpressions))

const confirming = shallowRef(false)
const submitting = shallowRef(false)
const serverError = shallowRef<string>()
const feeError = computed(() => serverError.value ?? (inRange.value ? undefined : feeRangeMessage(quote.value.minFeeCents, quote.value.maxFeeCents)))
const feedbackId = useId()
const money = { minimumFractionDigits: 0, maximumFractionDigits: 2 }

function setConfirming(value: boolean) {
  confirming.value = value
  emit('confirming', value)
}

watch(dollars, () => {
  serverError.value = undefined
  if (confirming.value)
    setConfirming(false)
})

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
      <AppField v-slot="f" label="Your Fee (USD)">
        <AppNumberField
          :id="f.id"
          v-model="dollars"
          name="fee"
          :step="1"
          :format-options="money"
          required
          :aria-invalid="!!feeError"
          :aria-describedby="feedbackId"
        />
      </AppField>
      <AppSlider v-model="dollars" label="Fee" :min="quote.minFeeCents / 100" :max="quote.maxFeeCents / 100" :step="1" />
    </div>

    <p v-if="feeError" :id="feedbackId" class="field-error" role="alert">
      {{ feeError }}
    </p>
    <p v-else :id="feedbackId" class="cpm">
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
      <span class="muted rules"><IconLock aria-hidden="true" /> Sealed and final: one Bid, no edits</span>
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
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: var(--font-size-sm);
}
</style>
