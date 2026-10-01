<script setup lang="ts">
import type { CampaignStatus } from '@wepush/contracts'
import type { BadgeTone } from '@/components/kit/AppBadge.vue'
import type { CampaignPhase } from '@/lib/campaignPhase.ts'
import { computed } from 'vue'
import IconAlarmClock from '~icons/lucide/alarm-clock'
import IconClock from '~icons/lucide/clock'
import IconLoader from '~icons/lucide/loader'
import IconLock from '~icons/lucide/lock'
import AppBadge from '@/components/kit/AppBadge.vue'
import { campaignPhase } from '@/lib/campaignPhase.ts'
import { formatTimeLeft } from '@/lib/format.ts'

const props = defineProps<{
  status: CampaignStatus
  biddingDeadline: string
  now?: Date
  /** Spell out the state ("Open · 3d left") rather than just the time left. */
  long?: boolean
}>()

const STYLE = {
  'open': { tone: 'neutral', icon: IconClock, state: 'Open' },
  'closing-soon': { tone: 'warning', icon: IconAlarmClock, state: 'Closing soon' },
  'closing': { tone: 'neutral', icon: IconLoader, state: 'Closing shortly' },
  'closed': { tone: 'neutral', icon: IconLock, state: 'Closed' },
} satisfies Record<CampaignPhase, { tone: BadgeTone, icon: unknown, state: string }>

const phase = computed(() => campaignPhase(props.status, props.biddingDeadline, props.now))
const style = computed(() => STYLE[phase.value])
const timeLeft = computed(() => phase.value === 'open' || phase.value === 'closing-soon'
  ? formatTimeLeft(props.biddingDeadline, props.now)
  : undefined)
</script>

<template>
  <AppBadge :tone="style.tone" :icon="style.icon" :title="style.state">
    <template v-if="!timeLeft">
      {{ style.state }}
    </template>
    <template v-else-if="long">
      {{ style.state }} · {{ timeLeft }}
    </template>
    <template v-else>
      <span class="visually-hidden">{{ style.state }}:</span> {{ timeLeft }}
    </template>
  </AppBadge>
</template>
