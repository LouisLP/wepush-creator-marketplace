<script setup lang="ts">
import type { MyBid } from '@wepush/contracts'
import { listMyBids } from '@wepush/contracts'
import { call } from '@/api'
import { isPastDeadline, usePollWhile } from '@/composables/usePollWhile.ts'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCents, formatTimeLeft } from '@/lib/format.ts'

const bids = useRequest(() => call(listMyBids))
defineExpose({ reload: bids.reload })

usePollWhile(
  () => !bids.loading.value && !!bids.data.value?.items.some(b => b.status === 'pending' && isPastDeadline(b.biddingDeadline)),
  bids.reload,
)

function detail(b: MyBid) {
  if (b.status === 'pending')
    return formatTimeLeft(b.biddingDeadline)
  return `${b.status === 'won' ? 'Won' : 'Lost'} · Rank #${b.rank}`
}
</script>

<template>
  <nav class="rail" aria-labelledby="my-bids-heading">
    <h2 id="my-bids-heading">
      My Bids
    </h2>
    <p v-if="bids.error.value" class="alert" role="alert">
      {{ bids.error.value }}
    </p>
    <p v-else-if="bids.data.value?.items.length === 0" class="muted">
      No Bids yet.
    </p>
    <ul v-else class="items">
      <li v-for="b in bids.data.value?.items" :key="b.id">
        <RouterLink :to="{ name: 'creator-campaign', params: { campaignId: b.campaignId } }" class="item">
          <span class="dot" :class="b.status" aria-hidden="true" />
          <span class="body">
            <strong>{{ b.campaignTitle }}</strong>
            <small class="muted">{{ formatCents(b.feeCents) }} · {{ detail(b) }}</small>
          </span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.rail {
  display: grid;
  gap: var(--space-sm);
  align-content: start;
}

h2 {
  font-size: var(--font-size-sm);
  text-transform: uppercase;
}

.items {
  display: grid;
  gap: var(--space-2xs);
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  color: inherit;
  text-decoration: none;
}

.item:hover,
.item.router-link-active {
  background-color: var(--color-bg-surface-hover);
}

.dot {
  flex: none;
  inline-size: 0.625rem;
  block-size: 0.625rem;
  margin-inline: 0.9375rem;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-default);
}

.dot.won {
  background-color: var(--color-success-default);
}

.dot.lost {
  background-color: var(--color-danger-default);
}

.body {
  display: grid;
}
</style>
