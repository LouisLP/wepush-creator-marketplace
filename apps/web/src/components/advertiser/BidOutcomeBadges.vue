<script setup lang="ts">
import type { AdvertiserBid, LossReason } from '@wepush/contracts'
import IconListX from '~icons/lucide/list-x'
import IconRuler from '~icons/lucide/ruler'
import IconTrophy from '~icons/lucide/trophy'
import IconWallet from '~icons/lucide/wallet'
import IconX from '~icons/lucide/x'
import AppBadge from '@/components/kit/AppBadge.vue'
import AppTooltip from '@/components/kit/AppTooltip.vue'
import { formatLossReason, formatLossReasonShort } from '@/lib/format.ts'

defineProps<{ bid: Pick<AdvertiserBid, 'status' | 'lossReason'>, provisional: boolean }>()

const LOSS_ICONS = { requirements_not_met: IconListX, fee_out_of_range: IconRuler, over_budget: IconWallet } satisfies Record<LossReason, unknown>
</script>

<template>
  <span class="badges">
    <AppBadge
      v-if="bid.status === 'won'"
      tone="success"
      :icon="IconTrophy"
      :variant="provisional ? 'outline' : 'subtle'"
    >
      {{ provisional ? 'Would win' : 'Won' }}
    </AppBadge>
    <!-- Lost is neutral for the Advertiser: losing Bids aren't a problem to fix -->
    <AppBadge v-else :icon="IconX" :variant="provisional ? 'outline' : 'subtle'">
      {{ provisional ? 'Would lose' : 'Lost' }}
    </AppBadge>
    <AppTooltip v-if="bid.lossReason" :content="formatLossReason(bid.lossReason)">
      <AppBadge :icon="LOSS_ICONS[bid.lossReason]" tabindex="0" class="reason">
        <span aria-hidden="true">{{ formatLossReasonShort(bid.lossReason) }}</span>
        <span class="visually-hidden">{{ formatLossReason(bid.lossReason) }}</span>
      </AppBadge>
    </AppTooltip>
  </span>
</template>

<style scoped>
.badges {
  display: inline-flex;
  gap: var(--space-2xs);
}

.reason:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
</style>
