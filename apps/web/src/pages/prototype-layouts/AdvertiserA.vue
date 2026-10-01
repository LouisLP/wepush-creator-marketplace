<script setup lang="ts">
// PROTOTYPE (#52) — Advertiser Campaign, variant A "Glance + disclosures": one scroll, KPI strip, compact Bids with row expand, Terms collapsed.
import type { AdvCampaign } from './fixtures.ts'
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import AppCollapsible from '@/components/kit/AppCollapsible.vue'
import { count, deadlineState, outcome, pct, platformIcon, platformLabel, usd, usdShort, vsTarget, when } from './fixtures.ts'
import PBadge from './PBadge.vue'
import PFactors from './PFactors.vue'
import POutcomeBadges from './POutcomeBadges.vue'

const props = defineProps<{ c: AdvCampaign }>()
const o = computed(() => outcome(props.c))
const provisional = computed(() => props.c.status === 'open')
const open = ref<string | null>(null)
const share = (cents: number) => `${(cents / props.c.budgetCents) * 100}%`
</script>

<template>
  <article class="p-stack">
    <header class="p-stack head">
      <h1>{{ c.title }}</h1>
      <p class="p-row">
        <PBadge :tone="deadlineState(c).tone" :icon="deadlineState(c).icon">{{ deadlineState(c).label }}</PBadge>
        <PBadge :icon="platformIcon(c.platform)">{{ platformLabel(c.platform) }}</PBadge>
        <PBadge v-for="cat in c.categories" :key="cat">{{ cat }}</PBadge>
      </p>
    </header>

    <section class="card p-stack" aria-labelledby="outcome-h">
      <h2 id="outcome-h" class="p-row">
        {{ provisional ? 'If it closed now' : 'Outcome' }}
        <PBadge v-if="provisional" outline icon="lucide:hourglass" label="Projected from Bids so far; Closing decides after the Bidding Deadline">Projected</PBadge>
        <span v-else class="muted p-xs">Closed {{ when(c.closedAt!) }}</span>
      </h2>
      <dl class="p-kpis">
        <div><dt><Icon icon="lucide:wallet" aria-hidden="true" />Spent</dt><dd>{{ usdShort(o.spent) }} <small class="muted">/ {{ usdShort(c.budgetCents) }}</small></dd></div>
        <div><dt><Icon icon="lucide:trophy" aria-hidden="true" />Winners</dt><dd>{{ o.winners.length }} <small class="muted">/ {{ c.bids.length }}</small></dd></div>
        <div><dt><Icon icon="lucide:eye" aria-hidden="true" />Est. Impressions</dt><dd>{{ count(o.imps) }}</dd></div>
        <div>
          <dt><Icon icon="lucide:gauge" aria-hidden="true" />Blended CPM</dt>
          <dd v-if="o.blendedCpm">
            {{ usd(o.blendedCpm) }}
            <PBadge :tone="vsTarget(o.blendedCpm, c.targetCpmCents).tone" :icon="vsTarget(o.blendedCpm, c.targetCpmCents).icon">{{ vsTarget(o.blendedCpm, c.targetCpmCents).label }}</PBadge>
          </dd>
          <dd v-else>
            —
          </dd>
        </div>
      </dl>
      <div class="p-waterfall" :class="{ provisional }" role="img" :aria-label="`${usdShort(o.spent)} of ${usdShort(c.budgetCents)} Budget filled by ${o.winners.length} winners`">
        <span v-for="w in o.winners" :key="w.id" :style="{ inlineSize: share(w.feeCents) }" :title="`#${w.rank} ${w.handle} · ${usdShort(w.feeCents)}`">#{{ w.rank }}</span>
      </div>
    </section>

    <section class="card p-stack" aria-labelledby="bids-h">
      <h2 id="bids-h">
        Bids <small class="muted">{{ c.bids.length }}</small>
      </h2>
      <table class="p-table">
        <thead>
          <tr><th>#</th><th>Creator</th><th class="num">Fee</th><th class="num">CPM vs Target</th><th class="num">Score</th><th>Outcome</th><th /></tr>
        </thead>
        <tbody v-for="b in c.bids" :key="b.id">
          <tr class="clickable" :class="{ lost: b.status === 'lost' }" @click="open = open === b.id ? null : b.id">
            <td class="p-num">
              {{ b.rank }}
            </td>
            <td>{{ b.handle }}</td>
            <td class="num">
              {{ usdShort(b.feeCents) }}
            </td>
            <td class="num">
              <PBadge :tone="vsTarget(b.cpmCents, c.targetCpmCents).tone" :icon="vsTarget(b.cpmCents, c.targetCpmCents).icon" :label="`Effective CPM ${usd(b.cpmCents)}`">
                {{ vsTarget(b.cpmCents, c.targetCpmCents).label }}
              </PBadge>
            </td>
            <td class="num">
              {{ b.score }}
            </td>
            <td><POutcomeBadges viewer="advertiser" :status="b.status" :loss-reason="b.lossReason" :provisional="provisional" /></td>
            <td>
              <button type="button" class="p-iconbtn" :aria-expanded="open === b.id" :aria-label="`Details for ${b.handle}`" @click.stop="open = open === b.id ? null : b.id">
                <Icon :icon="open === b.id ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
              </button>
            </td>
          </tr>
          <tr v-if="open === b.id">
            <td colspan="7">
              <div class="detail">
                <PFactors :factors="b.factors" />
                <p class="p-row muted p-xs">
                  <span><Icon icon="lucide:users" aria-hidden="true" /> {{ count(b.followers) }}</span>
                  <span><Icon icon="lucide:heart" aria-hidden="true" /> {{ pct(b.engagementRate) }}</span>
                  <span><Icon icon="lucide:eye" aria-hidden="true" /> {{ count(b.impressions) }}</span>
                  <span>CPM {{ usd(b.cpmCents) }}</span>
                  <span v-if="b.remainingBudgetCents !== null">Budget left when reached {{ usdShort(b.remainingBudgetCents) }}</span>
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <AppCollapsible title="Terms" class="p-collapse">
      <template #summary>
        <span class="p-sum-meta muted p-small p-num">{{ usdShort(c.budgetCents) }} · {{ usd(c.targetCpmCents) }} CPM · {{ when(c.deadline) }}</span>
      </template>
      <div class="p-stack">
        <p class="brief">
          {{ c.brief }}
        </p>
        <p class="p-row">
          <PBadge icon="lucide:users">≥ {{ count(c.minFollowers) }}</PBadge>
          <PBadge icon="lucide:heart">{{ c.minEngagementRate ? `≥ ${pct(c.minEngagementRate)}` : 'Any engagement' }}</PBadge>
        </p>
      </div>
    </AppCollapsible>
  </article>
</template>

<style scoped>
.head { gap: var(--space-xs); }
h2 { font-size: var(--font-size-lg); }
.detail { display: grid; gap: var(--space-sm); padding: var(--space-xs) 0; max-inline-size: 32rem; }
.brief { color: var(--color-text-secondary); }
</style>
