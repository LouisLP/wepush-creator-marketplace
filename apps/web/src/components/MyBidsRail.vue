<script setup lang="ts">
import { listMyBids } from '@wepush/contracts'
import { call } from '@/api'
import { isPastDeadline, usePollWhile } from '@/composables/usePollWhile.ts'
import { useRequest } from '@/composables/useRequest.ts'
import BidStatusBadge from './BidStatusBadge.vue'

const bids = useRequest(() => call(listMyBids))
defineExpose({ reload: bids.reload })

usePollWhile(
  () => !bids.loading.value && !!bids.data.value?.items.some(b => b.status === 'pending' && isPastDeadline(b.biddingDeadline)),
  bids.reload,
)
</script>

<template>
  <nav class="rail" aria-labelledby="my-bids-heading">
    <h2 id="my-bids-heading" class="rail-heading">
      My Bids
    </h2>
    <p v-if="bids.error.value" class="alert" role="alert">
      {{ bids.error.value }}
    </p>
    <p v-else-if="bids.data.value?.items.length === 0" class="muted empty">
      No Bids yet.
    </p>
    <ul v-else class="rail-list">
      <li v-for="b in bids.data.value?.items" :key="b.id">
        <RouterLink :to="{ name: 'creator-campaign', params: { campaignId: b.campaignId } }" class="rail-item">
          <span class="rail-title">{{ b.campaignTitle }}</span>
          <BidStatusBadge :status="b.status" :rank="b.rank" icon-only />
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.rail {
  display: grid;
  gap: var(--space-xs);
  align-content: start;
}

.empty {
  padding-inline: var(--space-sm);
  font-size: var(--font-size-sm);
}
</style>
