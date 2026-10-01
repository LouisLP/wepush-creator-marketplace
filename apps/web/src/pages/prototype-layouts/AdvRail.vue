<script setup lang="ts">
// PROTOTYPE (#52) — Advertiser Campaign rail. A: stacked Open/Closed · B: segmented toggle · C: one-line compact rows.
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { advCampaigns, deadlineState, outcome, platformIcon, platformLabel, usdShort } from './fixtures.ts'
import PBadge from './PBadge.vue'
import { useProtoState } from './state.ts'

const { campaign, variant, to } = useProtoState()
const open = advCampaigns.filter(c => c.status === 'open')
const closed = advCampaigns.filter(c => c.status === 'closed')
const tab = ref<'open' | 'closed'>(advCampaigns.find(c => c.id === campaign.value)?.status ?? 'open')
const shown = computed(() => (tab.value === 'open' ? open : closed))
const groups = computed(() => (variant.value === 'B' ? [{ key: tab.value, items: shown.value }] : [{ key: 'open', items: open }, { key: 'closed', items: closed }]))
</script>

<template>
  <nav class="p-stack rail" aria-label="Campaigns">
    <RouterLink :to="to({ c: 'new' })" class="btn">
      <Icon icon="lucide:plus" aria-hidden="true" /> New Campaign
    </RouterLink>
    <div v-if="variant === 'B'" class="p-seg" role="group" aria-label="Filter">
      <button type="button" :aria-pressed="tab === 'open'" @click="tab = 'open'">
        Open {{ open.length }}
      </button>
      <button type="button" :aria-pressed="tab === 'closed'" @click="tab = 'closed'">
        Closed {{ closed.length }}
      </button>
    </div>
    <section v-for="g in groups" :key="g.key">
      <h2 v-if="variant !== 'B'" class="p-rail-head">
        {{ g.key }}
      </h2>
      <ul class="p-rail-list">
        <li v-for="c in g.items" :key="c.id">
          <RouterLink :to="to({ c: c.id })" class="p-rail-item" :class="{ compact: variant === 'C' }" :aria-current="campaign === c.id ? 'page' : undefined">
            <span class="title">
              <Icon :icon="platformIcon(c.platform)" :aria-label="platformLabel(c.platform)" class="muted" />
              <strong>{{ c.title }}</strong>
            </span>
            <span v-if="c.status === 'open'" class="p-row meta">
              <PBadge :tone="deadlineState(c).tone" :icon="deadlineState(c).icon">{{ deadlineState(c).label }}</PBadge>
              <span class="muted p-xs"><Icon icon="lucide:gavel" aria-hidden="true" /> {{ c.bids.length }}</span>
            </span>
            <span v-else class="p-row meta muted p-xs p-num">
              <Icon icon="lucide:lock" aria-hidden="true" /> {{ usdShort(outcome(c).spent) }} / {{ usdShort(c.budgetCents) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </nav>
</template>

<style scoped>
.rail { gap: var(--space-sm); }
.title { display: flex; align-items: center; gap: var(--space-2xs); }
.meta { gap: var(--space-xs); }
.compact { grid-template-columns: 1fr auto; align-items: center; }
.compact .title strong { font-weight: var(--font-weight-medium, 500); font-size: var(--font-size-sm); }
</style>
