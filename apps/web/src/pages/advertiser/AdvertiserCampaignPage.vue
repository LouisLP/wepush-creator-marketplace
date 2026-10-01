<script setup lang="ts">
import { getAdvertiserCampaign } from '@wepush/contracts'
import { computed, onScopeDispose, shallowRef, watch } from 'vue'
import IconHeart from '~icons/lucide/heart'
import IconTag from '~icons/lucide/tag'
import IconUsers from '~icons/lucide/users'
import { call } from '@/api'
import BidsTable from '@/components/advertiser/BidsTable.vue'
import OutcomeCard from '@/components/advertiser/OutcomeCard.vue'
import CampaignStateBadge from '@/components/CampaignStateBadge.vue'
import InfoTip from '@/components/InfoTip.vue'
import AppBadge from '@/components/kit/AppBadge.vue'
import AppCollapsible from '@/components/kit/AppCollapsible.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import { useRequest } from '@/composables/useRequest.ts'
import { campaignPhase } from '@/lib/campaignPhase.ts'
import { formatCategory, formatCents, formatCentsShort, formatCount, formatDateTime, formatPercent, formatPlatform } from '@/lib/format.ts'
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'

const props = defineProps<{ id: string }>()

const TICK_MS = 5_000

const review = useRequest(() => call(getAdvertiserCampaign, { params: { id: props.id } }))
watch(() => props.id, () => void review.reload())
const campaign = computed(() => review.data.value)

const now = shallowRef(new Date())

// Past the deadline but not yet Closed: the worker is due to pick it up.
const closingShortly = computed(() =>
  campaign.value !== undefined && campaignPhase(campaign.value.status, campaign.value.biddingDeadline, now.value) === 'closing')

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
      <p class="badges">
        <span role="status">
          <CampaignStateBadge :status="campaign.status" :bidding-deadline="campaign.biddingDeadline" :now="now" long />
        </span>
        <AppBadge>
          <PlatformIcon :platform="campaign.requirements.platform" aria-hidden="true" />
          {{ formatPlatform(campaign.requirements.platform) }}
        </AppBadge>
        <AppBadge v-for="c in campaign.requirements.categories" :key="c" :icon="IconTag">
          {{ formatCategory(c) }}
        </AppBadge>
      </p>
    </header>

    <OutcomeCard :campaign="campaign" />

    <section class="card section" aria-labelledby="bids-heading">
      <h2 id="bids-heading">
        Bids <small class="muted">{{ campaign.bids.length }}</small>
        <InfoTip
          v-if="campaign.provisional && campaign.bids.length"
          content="Ranks if bidding closed now."
        />
      </h2>
      <BidsTable :bids="campaign.bids" :target-cpm-cents="campaign.targetCpmCents" :provisional="campaign.provisional" />
    </section>

    <AppCollapsible title="Terms" class="terms">
      <template #summary>
        <span class="summary">
          {{ formatCentsShort(campaign.budgetCents) }} · {{ formatCents(campaign.targetCpmCents) }} CPM · {{ formatDateTime(campaign.biddingDeadline) }}
        </span>
      </template>
      <div class="terms-body">
        <p class="brief">
          {{ campaign.brief }}
        </p>
        <dl class="terms-list">
          <div><dt>Budget</dt><dd>{{ formatCents(campaign.budgetCents) }}</dd></div>
          <div><dt>Target CPM</dt><dd>{{ formatCents(campaign.targetCpmCents) }}</dd></div>
          <div><dt>Bidding Deadline</dt><dd>{{ formatDateTime(campaign.biddingDeadline) }}</dd></div>
        </dl>
        <p class="badges">
          <AppBadge :icon="IconUsers">
            ≥ {{ formatCount(campaign.requirements.minFollowers) }} followers
          </AppBadge>
          <AppBadge :icon="IconHeart">
            {{ campaign.requirements.minEngagementRate === null ? 'Any engagement' : `≥ ${formatPercent(campaign.requirements.minEngagementRate)} engagement` }}
          </AppBadge>
        </p>
      </div>
    </AppCollapsible>
  </article>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-xl);
}

.head {
  display: grid;
  gap: var(--space-sm);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
}

.section {
  display: grid;
  gap: var(--space-md);
}

h2 {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-lg);
}

h2 small {
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
}

.terms {
  padding: var(--space-xs) var(--space-lg);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-surface);
}

.summary {
  margin-inline-start: auto;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-normal);
}

/* The summary takes the auto margin, so the chevron sits right after it */
.terms :deep(.summary + .chevron) {
  margin-inline-start: 0;
}

.terms-body {
  display: grid;
  gap: var(--space-lg);
  padding-block: var(--space-sm);
}

.brief {
  color: var(--color-text-secondary);
  white-space: pre-line;
}

.terms-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
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
