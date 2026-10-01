<script setup lang="ts">
import { getCreatorCampaign } from '@wepush/contracts'
import { computed, watch } from 'vue'
import { call } from '@/api'
import RelevanceFactors from '@/components/RelevanceFactors.vue'
import RequirementChecks from '@/components/RequirementChecks.vue'
import StepIndicator from '@/components/StepIndicator.vue'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCents, formatCount, formatDateTime, formatPlatform, formatTimeLeft } from '@/lib/format.ts'

const props = defineProps<{ id: string }>()

const review = useRequest(() => call(getCreatorCampaign, { params: { id: props.id } }))
watch(() => props.id, () => void review.reload())
const campaign = computed(() => review.data.value)
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
      <StepIndicator :current="campaign.hasBid ? 'track' : 'review'" />
    </header>

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

    <section class="card" aria-labelledby="quote-heading">
      <h2 id="quote-heading">
        Your Fee Quote
      </h2>
      <dl class="terms">
        <div><dt>Suggested Fee</dt><dd>{{ formatCents(campaign.feeQuote.suggestedFeeCents) }}</dd></div>
        <div>
          <dt>Fee Range</dt>
          <dd>{{ formatCents(campaign.feeQuote.minFeeCents) }} – {{ formatCents(campaign.feeQuote.maxFeeCents) }}</dd>
        </div>
        <div><dt>Estimated Impressions</dt><dd>{{ formatCount(campaign.feeQuote.estimatedImpressions) }}</dd></div>
      </dl>
    </section>

    <section class="card" aria-labelledby="relevance-heading">
      <h2 id="relevance-heading" class="visually-hidden">
        Relevance
      </h2>
      <RelevanceFactors :relevance="campaign.relevance" />
    </section>

    <footer v-if="campaign.hasBid" class="muted">
      You’ve bid on this Campaign.
    </footer>
    <footer v-else class="cta">
      <button type="button" class="btn" disabled aria-describedby="bid-soon">
        Bid on this Campaign
      </button>
      <small id="bid-soon" class="muted">Bidding opens soon.</small>
    </footer>
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

.cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}
</style>
