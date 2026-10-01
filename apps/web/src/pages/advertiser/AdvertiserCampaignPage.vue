<script setup lang="ts">
import { getAdvertiserCampaign } from '@wepush/contracts'
import { computed, onScopeDispose, shallowRef, watch } from 'vue'
import { call } from '@/api'
import BidsTable from '@/components/advertiser/BidsTable.vue'
import OutcomeCard from '@/components/advertiser/OutcomeCard.vue'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCents, formatCount, formatDateTime, formatPercent, formatPlatform, formatTimeLeft } from '@/lib/format.ts'
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'

const props = defineProps<{ id: string }>()

const TICK_MS = 5_000

const review = useRequest(() => call(getAdvertiserCampaign, { params: { id: props.id } }))
watch(() => props.id, () => void review.reload())
const campaign = computed(() => review.data.value)

const now = shallowRef(new Date())

// Past the deadline but not yet Closed: the worker is due to pick it up.
const closingShortly = computed(() =>
  campaign.value?.status === 'open' && new Date(campaign.value.biddingDeadline) <= now.value)

const tick = setInterval(() => {
  now.value = new Date()
  if (closingShortly.value)
    void review.reload()
}, TICK_MS)
onScopeDispose(() => clearInterval(tick))

// Keep the rail's Open/Closed sections in step once this page sees the Campaign close.
const campaigns = useAdvertiserCampaignsStore()
watch(campaign, (c) => {
  const listed = c && campaigns.byId(c.id)
  if (listed && listed.status !== c.status)
    void campaigns.reload()
})

const statusLine = computed(() => {
  const c = campaign.value
  if (!c)
    return ''
  if (c.status === 'closed')
    return 'Closed'
  return closingShortly.value ? 'Bidding over · closing shortly' : `Open · ${formatTimeLeft(c.biddingDeadline, now.value)}`
})
</script>

<template>
  <p v-if="review.error.value" class="alert" role="alert">
    {{ review.error.value }}
  </p>
  <article v-else-if="campaign" class="page" aria-labelledby="campaign-heading">
    <header class="head">
      <h1 id="campaign-heading">
        {{ campaign.title }}
      </h1>
      <p class="muted">
        {{ formatPlatform(campaign.requirements.platform) }} · <span class="status" role="status">{{ statusLine }}</span>
      </p>
    </header>

    <OutcomeCard :campaign="campaign" />

    <section class="card" aria-labelledby="bids-heading">
      <h2 id="bids-heading">
        Bids
      </h2>
      <p v-if="campaign.provisional && campaign.bids.length" class="muted">
        Provisional Ranks — what Closing would decide if it ran now. Select a Rank to see why.
      </p>
      <BidsTable :bids="campaign.bids" :target-cpm-cents="campaign.targetCpmCents" :provisional="campaign.provisional" />
    </section>

    <section class="card" aria-labelledby="terms-heading">
      <h2 id="terms-heading">
        Terms
      </h2>
      <blockquote class="brief">
        {{ campaign.brief }}
      </blockquote>
      <dl class="terms">
        <div><dt>Budget</dt><dd>{{ formatCents(campaign.budgetCents) }}</dd></div>
        <div><dt>Target CPM</dt><dd>{{ formatCents(campaign.targetCpmCents) }}</dd></div>
        <div><dt>Bidding Deadline</dt><dd>{{ formatDateTime(campaign.biddingDeadline) }}</dd></div>
        <div><dt>Platform</dt><dd>{{ formatPlatform(campaign.requirements.platform) }}</dd></div>
        <div><dt>Categories</dt><dd>{{ campaign.requirements.categories.join(', ') }}</dd></div>
        <div><dt>Min. followers</dt><dd>{{ formatCount(campaign.requirements.minFollowers) }}</dd></div>
        <div>
          <dt>Min. engagement</dt>
          <dd>{{ campaign.requirements.minEngagementRate === null ? 'Any' : formatPercent(campaign.requirements.minEngagementRate) }}</dd>
        </div>
      </dl>
    </section>
  </article>
</template>

<style scoped>
.page,
.head,
.card {
  display: grid;
  gap: var(--space-md);
}

.head {
  gap: var(--space-xs);
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
