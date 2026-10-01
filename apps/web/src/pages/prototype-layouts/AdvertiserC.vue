<script setup lang="ts">
// PROTOTYPE (#52) — Advertiser Campaign, variant C "Inspector": Bids table is the page; a sticky aside shows Campaign facts, or the selected Bid.
import type { AdvCampaign } from './fixtures.ts'
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { count, deadlineState, LOSS, outcome, pct, platformIcon, platformLabel, usd, usdShort, vsTarget, when } from './fixtures.ts'
import PBadge from './PBadge.vue'
import PFactors from './PFactors.vue'
import POutcomeBadges from './POutcomeBadges.vue'

const props = defineProps<{ c: AdvCampaign }>()
const o = computed(() => outcome(props.c))
const provisional = computed(() => props.c.status === 'open')
const sel = ref<string | null>(null)
const bid = computed(() => props.c.bids.find(b => b.id === sel.value))
watch(() => props.c.id, () => (sel.value = null))
const share = (cents: number) => `${(cents / props.c.budgetCents) * 100}%`
</script>

<template>
  <div class="split">
    <article class="p-stack main">
      <header class="p-row head">
        <h1>{{ c.title }}</h1>
        <PBadge :tone="deadlineState(c).tone" :icon="deadlineState(c).icon">{{ deadlineState(c).label }}</PBadge>
      </header>

      <div class="summary card">
        <div class="bar">
          <div class="p-waterfall" :class="{ provisional }">
            <span v-for="w in o.winners" :key="w.id" :style="{ inlineSize: share(w.feeCents) }" :title="`${w.handle} ${usdShort(w.feeCents)}`">#{{ w.rank }}</span>
          </div>
          <p class="p-row p-small p-num">
            <strong>{{ usdShort(o.spent) }}</strong><span class="muted">of {{ usdShort(c.budgetCents) }}</span>
            <span class="muted">·</span> <Icon icon="lucide:trophy" aria-label="Winners" /> {{ o.winners.length }}/{{ c.bids.length }}
            <span class="muted">·</span> <Icon icon="lucide:eye" aria-label="Est. Impressions" /> {{ count(o.imps) }}
            <template v-if="o.blendedCpm">
              <span class="muted">·</span> CPM {{ usd(o.blendedCpm) }}
              <PBadge :tone="vsTarget(o.blendedCpm, c.targetCpmCents).tone" :icon="vsTarget(o.blendedCpm, c.targetCpmCents).icon">{{ vsTarget(o.blendedCpm, c.targetCpmCents).label }}</PBadge>
            </template>
            <PBadge v-if="provisional" outline icon="lucide:hourglass">Projected</PBadge>
          </p>
        </div>
      </div>

      <table class="p-table">
        <thead>
          <tr><th>#</th><th>Creator</th><th class="num">Fee</th><th class="num">vs Target</th><th class="num">Score</th><th>Outcome</th></tr>
        </thead>
        <tbody>
          <tr v-for="b in c.bids" :key="b.id" class="clickable" :class="{ lost: b.status === 'lost', sel: sel === b.id }" :aria-selected="sel === b.id" @click="sel = sel === b.id ? null : b.id">
            <td>{{ b.rank }}</td>
            <td>{{ b.handle }}</td>
            <td class="num">
              {{ usdShort(b.feeCents) }}
            </td>
            <td class="num">
              <PBadge :tone="vsTarget(b.cpmCents, c.targetCpmCents).tone" :icon="vsTarget(b.cpmCents, c.targetCpmCents).icon">{{ vsTarget(b.cpmCents, c.targetCpmCents).label }}</PBadge>
            </td>
            <td class="num">
              {{ b.score }}
            </td>
            <td><POutcomeBadges viewer="advertiser" :status="b.status" :loss-reason="b.lossReason" :provisional="provisional" /></td>
          </tr>
        </tbody>
      </table>
    </article>

    <aside class="card inspector p-stack" aria-label="Inspector">
      <template v-if="bid">
        <header class="p-row ihead">
          <strong>#{{ bid.rank }} {{ bid.handle }}</strong>
          <button type="button" class="p-iconbtn" aria-label="Close" @click="sel = null">
            <Icon icon="lucide:x" />
          </button>
        </header>
        <POutcomeBadges viewer="advertiser" :status="bid.status" :provisional="provisional" />
        <p v-if="bid.lossReason" class="muted p-small">
          <Icon :icon="LOSS[bid.lossReason].icon" aria-hidden="true" /> {{ LOSS[bid.lossReason].long }}
        </p>
        <dl class="facts">
          <div><dt><Icon icon="lucide:users" aria-label="Followers" /></dt><dd>{{ count(bid.followers) }}</dd></div>
          <div><dt><Icon icon="lucide:heart" aria-label="Engagement" /></dt><dd>{{ pct(bid.engagementRate) }}</dd></div>
          <div><dt><Icon icon="lucide:eye" aria-label="Est. Impressions" /></dt><dd>{{ count(bid.impressions) }}</dd></div>
          <div><dt><Icon icon="lucide:gauge" aria-label="Effective CPM" /></dt><dd>{{ usd(bid.cpmCents) }}</dd></div>
          <div v-if="bid.remainingBudgetCents !== null"><dt><Icon icon="lucide:wallet" aria-label="Budget left when reached" /></dt><dd>{{ usdShort(bid.remainingBudgetCents) }} left when reached</dd></div>
        </dl>
        <h3 class="p-small">
          Score {{ bid.score }}
        </h3>
        <PFactors :factors="bid.factors" />
      </template>
      <template v-else>
        <h2 class="p-small muted">
          Terms
        </h2>
        <dl class="facts">
          <div><dt><Icon icon="lucide:wallet" aria-label="Budget" /></dt><dd>{{ usdShort(c.budgetCents) }} Budget</dd></div>
          <div><dt><Icon icon="lucide:target" aria-label="Target CPM" /></dt><dd>{{ usd(c.targetCpmCents) }} Target CPM</dd></div>
          <div><dt><Icon icon="lucide:calendar-clock" aria-label="Bidding Deadline" /></dt><dd>{{ when(c.deadline) }}</dd></div>
        </dl>
        <p class="p-row">
          <PBadge :icon="platformIcon(c.platform)">{{ platformLabel(c.platform) }}</PBadge>
          <PBadge v-for="cat in c.categories" :key="cat">{{ cat }}</PBadge>
          <PBadge icon="lucide:users">≥ {{ count(c.minFollowers) }}</PBadge>
          <PBadge v-if="c.minEngagementRate" icon="lucide:heart">≥ {{ pct(c.minEngagementRate) }}</PBadge>
        </p>
        <p class="p-clamp muted p-small" :title="c.brief">
          {{ c.brief }}
        </p>
        <p class="muted p-xs">
          <Icon icon="lucide:mouse-pointer-click" aria-hidden="true" /> Select a Bid to inspect it
        </p>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.split { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; gap: var(--space-lg); align-items: start; }
@media (width < 70rem) { .split { grid-template-columns: 1fr; } }
.head { gap: var(--space-sm); }
.summary { padding: var(--space-sm) var(--space-md); }
.bar { display: grid; gap: var(--space-xs); }
.inspector { position: sticky; inset-block-start: 4.5rem; gap: var(--space-sm); }
.ihead { justify-content: space-between; }
.facts { display: grid; gap: var(--space-2xs); font-size: var(--font-size-sm); }
.facts > div { display: grid; grid-template-columns: 1.25rem 1fr; align-items: center; }
.facts dt { color: var(--color-text-muted); }
</style>
