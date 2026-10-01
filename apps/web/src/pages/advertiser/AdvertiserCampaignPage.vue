<script setup lang="ts">
import { computed } from 'vue'
import { formatCents, formatDateTime, formatPlatform, formatTimeLeft } from '@/lib/format.ts'
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'

const props = defineProps<{ id: string }>()

const campaigns = useAdvertiserCampaignsStore()
const campaign = computed(() => campaigns.byId(props.id))
</script>

<template>
  <p v-if="campaigns.error" class="alert" role="alert">
    {{ campaigns.error }}
  </p>
  <section v-else-if="campaign" class="page" aria-labelledby="campaign-heading">
    <header>
      <h1 id="campaign-heading">
        {{ campaign.title }}
      </h1>
      <p class="muted">
        {{ formatPlatform(campaign.platform) }} · {{ campaign.status }}
      </p>
    </header>
    <dl class="card stats">
      <div><dt>Budget</dt><dd>{{ formatCents(campaign.budgetCents) }}</dd></div>
      <div v-if="campaign.spentCents !== null">
        <dt>Spent</dt><dd>{{ formatCents(campaign.spentCents) }}</dd>
      </div>
      <div><dt>Bids</dt><dd>{{ campaign.bidCount }}</dd></div>
      <div>
        <dt>Bidding Deadline</dt>
        <dd>
          {{ formatDateTime(campaign.biddingDeadline) }}
          <small v-if="campaign.status === 'open'" class="muted">({{ formatTimeLeft(campaign.biddingDeadline) }})</small>
        </dd>
      </div>
    </dl>
  </section>
  <p v-else-if="campaigns.items" class="muted">
    Campaign not found.
  </p>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-md);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
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
</style>
