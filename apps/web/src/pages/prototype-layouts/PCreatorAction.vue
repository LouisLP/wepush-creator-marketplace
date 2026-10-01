<script setup lang="ts">
// PROTOTYPE (#52) — the state-morphing heart of the Creator Campaign page: composer, or the Bid's status/outcome.
import type { CreatorCampaign } from './fixtures.ts'
import { Icon } from '@iconify/vue'
import { LOSS, timeLeft, usd, usdShort, vsTarget, when } from './fixtures.ts'
import PBadge from './PBadge.vue'
import PBidComposer from './PBidComposer.vue'
import PFactors from './PFactors.vue'
import POutcomeBadges from './POutcomeBadges.vue'

defineProps<{ c: CreatorCampaign, showFactors?: boolean }>()
</script>

<template>
  <PBidComposer v-if="!c.bid" :key="c.id" :campaign="c" />
  <div v-else class="p-stack status">
    <p class="p-row">
      <POutcomeBadges viewer="creator" :status="c.bid.status" :rank="c.bid.rank" :loss-reason="c.bid.lossReason" />
    </p>
    <p class="p-row p-small p-num">
      Your Fee <strong>{{ usdShort(c.bid.feeCents) }}</strong>
      <span class="muted">·</span> CPM {{ usd(c.bid.cpmCents) }}
      <PBadge :tone="vsTarget(c.bid.cpmCents, c.targetCpmCents).tone" :icon="vsTarget(c.bid.cpmCents, c.targetCpmCents).icon">{{ vsTarget(c.bid.cpmCents, c.targetCpmCents).label }}</PBadge>
      <template v-if="c.bid.score !== null">
        <span class="muted">·</span> Score {{ c.bid.score }}
      </template>
    </p>
    <p v-if="c.bid.status === 'pending'" class="muted p-small">
      <Icon icon="lucide:calendar-clock" aria-hidden="true" /> Decided at the Bidding Deadline — {{ timeLeft(c.deadline) }}
    </p>
    <p v-if="c.bid.lossReason" class="p-small">
      {{ LOSS[c.bid.lossReason].long }}<template v-if="c.bid.lossReason === 'over_budget' && c.bid.remainingBudgetCents !== null">
        — {{ usdShort(c.bid.remainingBudgetCents) }} was left when your Bid was reached.
      </template>
    </p>
    <PFactors v-if="showFactors && c.bid.scoreFactors" :factors="c.bid.scoreFactors" />
    <p class="muted p-xs">
      Placed {{ when(c.bid.placedAt) }}
    </p>
  </div>
</template>

<style scoped>
.status { gap: var(--space-xs); }
</style>
