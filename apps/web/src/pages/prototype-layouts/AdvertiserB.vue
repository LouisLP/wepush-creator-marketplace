<script setup lang="ts">
// PROTOTYPE (#52) — Advertiser Campaign, variant B "Tabs": headline numbers in the header, then Outcome | Bids | Terms tabs.
import type { AdvCampaign } from './fixtures.ts'
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { count, deadlineState, outcome, pct, platformIcon, platformLabel, usd, usdShort, vsTarget, when } from './fixtures.ts'
import PBadge from './PBadge.vue'
import PFactors from './PFactors.vue'
import POutcomeBadges from './POutcomeBadges.vue'

const props = defineProps<{ c: AdvCampaign }>()
const o = computed(() => outcome(props.c))
const provisional = computed(() => props.c.status === 'open')
const tab = ref<'outcome' | 'bids' | 'terms'>('outcome')
const open = ref<string | null>(null)
const share = (cents: number) => `${(cents / props.c.budgetCents) * 100}%`
</script>

<template>
  <article class="p-stack">
    <header class="card head">
      <div class="p-stack title">
        <h1>{{ c.title }}</h1>
        <p class="p-row">
          <PBadge :tone="deadlineState(c).tone" :icon="deadlineState(c).icon">{{ deadlineState(c).label }}</PBadge>
          <PBadge :icon="platformIcon(c.platform)">{{ platformLabel(c.platform) }}</PBadge>
          <PBadge v-for="cat in c.categories" :key="cat">{{ cat }}</PBadge>
        </p>
      </div>
      <dl class="p-kpis nums">
        <div><dt>{{ provisional ? 'Spent (proj.)' : 'Spent' }}</dt><dd>{{ usdShort(o.spent) }} <small class="muted">/ {{ usdShort(c.budgetCents) }}</small></dd></div>
        <div><dt>Winners</dt><dd>{{ o.winners.length }} <small class="muted">/ {{ c.bids.length }}</small></dd></div>
        <div>
          <dt>Blended CPM</dt>
          <dd v-if="o.blendedCpm">
            <PBadge :tone="vsTarget(o.blendedCpm, c.targetCpmCents).tone" :icon="vsTarget(o.blendedCpm, c.targetCpmCents).icon" :label="usd(o.blendedCpm)">{{ vsTarget(o.blendedCpm, c.targetCpmCents).label }}</PBadge>
          </dd>
        </div>
      </dl>
    </header>

    <div class="p-tabs" role="tablist">
      <button role="tab" :aria-selected="tab === 'outcome'" @click="tab = 'outcome'">
        <Icon icon="lucide:trophy" aria-hidden="true" /> {{ provisional ? 'If it closed now' : 'Outcome' }}
      </button>
      <button role="tab" :aria-selected="tab === 'bids'" @click="tab = 'bids'">
        <Icon icon="lucide:gavel" aria-hidden="true" /> Bids <PBadge>{{ c.bids.length }}</PBadge>
      </button>
      <button role="tab" :aria-selected="tab === 'terms'" @click="tab = 'terms'">
        <Icon icon="lucide:file-text" aria-hidden="true" /> Terms
      </button>
    </div>

    <section v-if="tab === 'outcome'" role="tabpanel" class="p-stack">
      <p v-if="provisional" class="muted p-small">
        <Icon icon="lucide:info" aria-hidden="true" /> Projected — Closing decides after the Bidding Deadline ({{ when(c.deadline) }}).
      </p>
      <div class="p-waterfall" :class="{ provisional }" role="img" :aria-label="`${usdShort(o.spent)} of ${usdShort(c.budgetCents)} Budget`">
        <span v-for="w in o.winners" :key="w.id" :style="{ inlineSize: share(w.feeCents) }">#{{ w.rank }}</span>
      </div>
      <ol class="winners">
        <li v-for="w in o.winners" :key="w.id" class="p-row">
          <span class="rank">#{{ w.rank }}</span>
          <strong>{{ w.handle }}</strong>
          <span class="muted p-small p-num">{{ usdShort(w.feeCents) }} · <Icon icon="lucide:eye" aria-label="Est. Impressions" /> {{ count(w.impressions) }}</span>
          <PBadge :tone="vsTarget(w.cpmCents, c.targetCpmCents).tone" :icon="vsTarget(w.cpmCents, c.targetCpmCents).icon">{{ vsTarget(w.cpmCents, c.targetCpmCents).label }}</PBadge>
        </li>
      </ol>
    </section>

    <section v-else-if="tab === 'bids'" role="tabpanel">
      <table class="p-table">
        <thead>
          <tr><th>#</th><th>Creator</th><th class="num">Followers</th><th class="num">Fee</th><th class="num">CPM</th><th class="num">Score</th><th>Outcome</th></tr>
        </thead>
        <tbody v-for="b in c.bids" :key="b.id">
          <tr class="clickable" :class="{ lost: b.status === 'lost', sel: open === b.id }" @click="open = open === b.id ? null : b.id">
            <td>{{ b.rank }}</td>
            <td>{{ b.handle }}</td>
            <td class="num">
              {{ count(b.followers) }}
            </td>
            <td class="num">
              {{ usdShort(b.feeCents) }}
            </td>
            <td class="num">
              <PBadge :tone="vsTarget(b.cpmCents, c.targetCpmCents).tone" :icon="vsTarget(b.cpmCents, c.targetCpmCents).icon">{{ usd(b.cpmCents) }}</PBadge>
            </td>
            <td class="num">
              {{ b.score }}
            </td>
            <td><POutcomeBadges viewer="advertiser" :status="b.status" :loss-reason="b.lossReason" :provisional="provisional" /></td>
          </tr>
          <tr v-if="open === b.id">
            <td colspan="7">
              <div class="detail">
                <PFactors :factors="b.factors" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-else role="tabpanel" class="p-stack">
      <p class="brief">
        {{ c.brief }}
      </p>
      <dl class="p-kpis">
        <div><dt>Budget</dt><dd>{{ usdShort(c.budgetCents) }}</dd></div>
        <div><dt>Target CPM</dt><dd>{{ usd(c.targetCpmCents) }}</dd></div>
        <div><dt>Deadline</dt><dd class="p-small">{{ when(c.deadline) }}</dd></div>
        <div><dt>Min. followers</dt><dd>{{ count(c.minFollowers) }}</dd></div>
        <div><dt>Min. engagement</dt><dd>{{ c.minEngagementRate ? pct(c.minEngagementRate) : 'Any' }}</dd></div>
      </dl>
    </section>
  </article>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-lg); }
.title { gap: var(--space-xs); }
.nums { grid-template-columns: repeat(3, auto); }
.winners { list-style: none; padding: 0; display: grid; gap: var(--space-xs); }
.rank { inline-size: 2rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
.detail { max-inline-size: 32rem; padding: var(--space-xs) 0; }
.brief { color: var(--color-text-secondary); max-inline-size: 60ch; }
</style>
