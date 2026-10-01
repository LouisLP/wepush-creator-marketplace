<script setup lang="ts">
// PROTOTYPE (#52) — Creator rail. A: Matched + My Bids stacked · B: segmented toggle · C: one-line compact rows.
import { computed, ref } from 'vue'
import { deadlineState, matched, myBids, usdShort } from './fixtures.ts'
import PBadge from './PBadge.vue'
import POutcomeBadges from './POutcomeBadges.vue'
import { useProtoState } from './state.ts'

const { campaign, variant, to } = useProtoState()
const tab = ref<'matched' | 'bids'>(myBids.some(c => c.id === campaign.value) ? 'bids' : 'matched')
const showMatched = computed(() => variant.value !== 'B' || tab.value === 'matched')
const showBids = computed(() => variant.value !== 'B' || tab.value === 'bids')
</script>

<template>
  <nav class="p-stack rail" aria-label="Campaigns">
    <div v-if="variant === 'B'" class="p-seg" role="group" aria-label="Filter">
      <button type="button" :aria-pressed="tab === 'matched'" @click="tab = 'matched'">
        Matched {{ matched.length }}
      </button>
      <button type="button" :aria-pressed="tab === 'bids'" @click="tab = 'bids'">
        My Bids {{ myBids.length }}
      </button>
    </div>
    <section v-if="showMatched">
      <h2 v-if="variant !== 'B'" class="p-rail-head">
        Matched
      </h2>
      <ul class="p-rail-list">
        <li v-for="c in matched" :key="c.id">
          <RouterLink :to="to({ c: c.id })" class="p-rail-item" :class="{ compact: variant === 'C' }" :aria-current="campaign === c.id ? 'page' : undefined">
            <strong>{{ c.title }}</strong>
            <span class="p-row meta">
              <PBadge :label="`Relevance ${c.relevance}`">{{ c.relevance }}</PBadge>
              <PBadge v-if="variant !== 'C'" :tone="deadlineState(c).tone" :icon="deadlineState(c).icon">{{ deadlineState(c).label }}</PBadge>
              <span v-if="variant === 'A'" class="muted p-xs p-num">~{{ usdShort(c.quote.suggestedCents) }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>
    <section v-if="showBids">
      <h2 v-if="variant !== 'B'" class="p-rail-head">
        My Bids
      </h2>
      <ul class="p-rail-list">
        <li v-for="c in myBids" :key="c.id">
          <RouterLink :to="to({ c: c.id })" class="p-rail-item" :class="{ compact: variant === 'C' }" :aria-current="campaign === c.id ? 'page' : undefined">
            <strong>{{ c.title }}</strong>
            <span class="p-row meta">
              <POutcomeBadges viewer="creator" :status="c.bid!.status" :rank="c.bid!.rank" :icon-only="variant === 'C'" />
              <span v-if="variant !== 'C'" class="muted p-xs p-num">{{ usdShort(c.bid!.feeCents) }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </nav>
</template>

<style scoped>
.rail { gap: var(--space-sm); }
.meta { gap: var(--space-xs); }
.compact { grid-template-columns: 1fr auto; align-items: center; }
.compact strong { font-size: var(--font-size-sm); }
</style>
