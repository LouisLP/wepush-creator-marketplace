<script setup lang="ts">
import type { CreatorBid } from '@wepush/contracts'
import type { Step } from '@/components/StepIndicator.vue'
import { getCreatorCampaign } from '@wepush/contracts'
import { computed, shallowRef, watch } from 'vue'
import { call } from '@/api'
import BidComposer from '@/components/BidComposer.vue'
import BidStatus from '@/components/BidStatus.vue'
import RelevanceFactors from '@/components/RelevanceFactors.vue'
import RequirementChecks from '@/components/RequirementChecks.vue'
import StepIndicator from '@/components/StepIndicator.vue'
import { isPastDeadline, usePollWhile } from '@/composables/usePollWhile.ts'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCents, formatDateTime, formatPlatform, formatTimeLeft } from '@/lib/format.ts'
import { useRefreshRail } from './refresh.ts'

const props = defineProps<{ id: string }>()

const refreshRail = useRefreshRail()

const review = useRequest(() => call(getCreatorCampaign, { params: { id: props.id } }))
const confirming = shallowRef(false)
watch(() => props.id, () => {
  confirming.value = false
  void review.reload()
})
const campaign = computed(() => review.data.value)

const step = computed<Step>(() => {
  const bid = campaign.value?.bid
  if (bid)
    return bid.status === 'pending' ? 'track' : 'outcome'
  return confirming.value ? 'bid' : 'review'
})

function onPlaced(bid: CreatorBid) {
  review.data.value = { ...campaign.value!, bid }
  confirming.value = false
  refreshRail()
}

usePollWhile(
  () => campaign.value?.bid?.status === 'pending' && isPastDeadline(campaign.value.biddingDeadline) && !review.loading.value,
  review.reload,
)
</script>

<template>
  <p v-if="review.error.value" class="alert" role="alert">
    {{ review.error.value }}
  </p>
  <article v-else-if="campaign" class="review" aria-labelledby="campaign-heading">
    <header class="head">
      <h1 id="campaign-heading">
        {{ campaign.title }}
      </h1>
      <p class="muted">
        {{ campaign.advertiserName }} · {{ formatPlatform(campaign.requirements.platform) }} ·
        {{ campaign.status === 'open' ? formatTimeLeft(campaign.biddingDeadline) : 'closed' }}
      </p>
      <StepIndicator :current="step" />
    </header>

    <section v-if="campaign.bid" class="card" aria-labelledby="bid-heading">
      <h2 id="bid-heading">
        Your Bid
      </h2>
      <BidStatus :bid="campaign.bid" :campaign="campaign" />
    </section>

    <section aria-labelledby="brief-heading">
      <h2 id="brief-heading" class="visually-hidden">
        Brief
      </h2>
      <blockquote class="brief">
        {{ campaign.brief }}
      </blockquote>
    </section>

    <section class="card" aria-labelledby="terms-heading">
      <h2 id="terms-heading">
        Terms
      </h2>
      <dl class="terms">
        <div><dt>Budget</dt><dd>{{ formatCents(campaign.budgetCents) }}</dd></div>
        <div><dt>Target CPM</dt><dd>{{ formatCents(campaign.targetCpmCents) }}</dd></div>
        <div><dt>Bidding Deadline</dt><dd>{{ formatDateTime(campaign.biddingDeadline) }}</dd></div>
      </dl>
    </section>

    <section class="card" aria-labelledby="requirements-heading">
      <h2 id="requirements-heading">
        Requirements
      </h2>
      <RequirementChecks :checks="campaign.requirementChecks" />
    </section>

    <section class="card" aria-labelledby="relevance-heading">
      <h2 id="relevance-heading" class="visually-hidden">
        Relevance
      </h2>
      <RelevanceFactors :relevance="campaign.relevance" />
    </section>

    <section v-if="!campaign.bid" class="card" aria-labelledby="place-heading">
      <h2 id="place-heading">
        Place your Bid
      </h2>
      <BidComposer :key="campaign.id" :campaign="campaign" @placed="onPlaced" @confirming="confirming = $event" />
    </section>
  </article>
</template>

<style scoped>
.review,
.head {
  display: grid;
  gap: var(--space-md);
}

.head {
  gap: var(--space-xs);
}

.card {
  display: grid;
  gap: var(--space-sm);
}

.card h2 {
  font-size: var(--font-size-lg);
}

.brief {
  margin: 0;
  padding-inline-start: var(--space-md);
  border-inline-start: 3px solid var(--color-border-default);
  white-space: pre-line;
}

.terms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--space-md);
}

dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

dd {
  font-weight: var(--font-weight-semibold);
}
</style>
