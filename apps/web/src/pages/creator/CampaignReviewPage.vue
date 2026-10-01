<script setup lang="ts">
import type { CreatorBid } from '@wepush/contracts'
import type { Step } from '@/components/StepIndicator.vue'
import { getCreatorCampaign } from '@wepush/contracts'
import { computed, shallowRef, watch } from 'vue'
import IconAlarmClock from '~icons/lucide/alarm-clock'
import IconClock from '~icons/lucide/clock'
import IconLock from '~icons/lucide/lock'
import IconSparkles from '~icons/lucide/sparkles'
import { call } from '@/api'
import BidComposer from '@/components/BidComposer.vue'
import BidStatus from '@/components/BidStatus.vue'
import AppBadge from '@/components/kit/AppBadge.vue'
import AppCollapsible from '@/components/kit/AppCollapsible.vue'
import RelevanceFactors from '@/components/RelevanceFactors.vue'
import RequirementChecks from '@/components/RequirementChecks.vue'
import ScoreFactors from '@/components/ScoreFactors.vue'
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

const DAY = 24 * 60 * 60 * 1000

const state = computed(() => {
  const c = campaign.value!
  if (c.status === 'closed')
    return { label: 'Closed', tone: 'neutral', icon: IconLock } as const
  if (isPastDeadline(c.biddingDeadline))
    return { label: 'Closing…', tone: 'neutral', icon: IconClock } as const
  const soon = new Date(c.biddingDeadline).getTime() - Date.now() < DAY
  return { label: formatTimeLeft(c.biddingDeadline), tone: soon ? 'warning' : 'neutral', icon: soon ? IconAlarmClock : IconClock } as const
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
      <div class="meta">
        <span class="muted">{{ campaign.advertiserName }}</span>
        <AppBadge class="state" :tone="state.tone" :icon="state.icon">
          {{ state.label }}
        </AppBadge>
        <AppBadge>{{ formatPlatform(campaign.requirements.platform) }}</AppBadge>
        <StepIndicator :current="step" class="steps" />
      </div>
    </header>

    <section class="card action" aria-labelledby="action-heading">
      <h2 id="action-heading">
        {{ campaign.bid ? 'Your Bid' : 'Place your Bid' }}
      </h2>
      <BidStatus v-if="campaign.bid" :bid="campaign.bid" :campaign="campaign" />
      <BidComposer v-else :key="campaign.id" :campaign="campaign" @placed="onPlaced" @confirming="confirming = $event" />
    </section>

    <section class="fit" aria-label="Fit">
      <AppBadge :icon="IconSparkles" class="relevance">
        Relevance {{ campaign.relevance.value }}
      </AppBadge>
      <RequirementChecks :checks="campaign.requirementChecks" />
    </section>

    <div class="disclosures">
      <AppCollapsible title="Brief" class="disclosure">
        <template #summary>
          <span class="summary preview">{{ campaign.brief }}</span>
        </template>
        <p class="brief">
          {{ campaign.brief }}
        </p>
      </AppCollapsible>

      <AppCollapsible v-if="campaign.bid?.outcome" title="Why this Score" class="disclosure">
        <template #summary>
          <span class="summary">{{ campaign.bid.outcome.score }}</span>
        </template>
        <ScoreFactors :score="campaign.bid.outcome.score" :factors="campaign.bid.outcome.factors" />
        <small class="muted note">
          Scoring Version {{ campaign.bid.outcome.scoringVersion }}. Rank puts Eligible Bids first, then higher Score, lower Fee, earlier Bid.
        </small>
      </AppCollapsible>
      <AppCollapsible v-else title="Why this Relevance" class="disclosure">
        <template #summary>
          <span class="summary">{{ campaign.relevance.value }}</span>
        </template>
        <RelevanceFactors :relevance="campaign.relevance" />
      </AppCollapsible>

      <AppCollapsible title="Terms" class="disclosure">
        <template #summary>
          <span class="summary">{{ formatCents(campaign.budgetCents) }} · {{ formatCents(campaign.targetCpmCents) }} CPM</span>
        </template>
        <dl class="terms">
          <div><dt>Budget</dt><dd>{{ formatCents(campaign.budgetCents) }}</dd></div>
          <div><dt>Target CPM</dt><dd>{{ formatCents(campaign.targetCpmCents) }}</dd></div>
          <div><dt>Bidding Deadline</dt><dd>{{ formatDateTime(campaign.biddingDeadline) }}</dd></div>
          <div><dt>Deliverable</dt><dd>1 Post</dd></div>
        </dl>
      </AppCollapsible>
    </div>
  </article>
</template>

<style scoped>
.review {
  display: grid;
  gap: var(--space-xl);
}

.head {
  display: grid;
  gap: var(--space-sm);
}

.meta,
.fit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.steps {
  margin-inline-start: auto;
}

.action {
  display: grid;
  gap: var(--space-lg);
}

.action h2 {
  font-size: var(--font-size-lg);
}

.fit {
  align-items: start;
}

.fit > ul {
  flex: 1 1 20rem;
}

.relevance {
  padding: var(--space-2xs) var(--space-sm);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

.disclosures {
  display: grid;
  gap: var(--space-sm);
}

.disclosure {
  padding: var(--space-xs) var(--space-lg);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-surface);
}

.summary {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-normal);
  text-align: end;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview {
  padding-inline-start: var(--space-sm);
  text-align: start;
}

.brief {
  white-space: pre-line;
}

.note {
  display: block;
  margin-block-start: var(--space-sm);
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
