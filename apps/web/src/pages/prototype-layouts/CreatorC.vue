<script setup lang="ts">
// PROTOTYPE (#52) — Creator Campaign, variant C "Inspector": brief + action in the main column; terms, fit and factors in a sticky aside.
import type { CreatorCampaign } from './fixtures.ts'
import { Icon } from '@iconify/vue'
import { deadlineState, platformIcon, platformLabel, step, usd, usdShort, when } from './fixtures.ts'
import PBadge from './PBadge.vue'
import PCreatorAction from './PCreatorAction.vue'
import PFactors from './PFactors.vue'
import PSteps from './PSteps.vue'

defineProps<{ c: CreatorCampaign }>()
</script>

<template>
  <div class="split">
    <article class="p-stack">
      <header class="p-stack head">
        <PSteps :current="step(c)" />
        <h1>{{ c.title }}</h1>
        <p class="muted">
          {{ c.advertiser }}
        </p>
      </header>
      <p class="brief">
        {{ c.brief }}
      </p>
      <section class="card p-stack" aria-label="Bid">
        <PCreatorAction :c="c" />
      </section>
    </article>

    <aside class="card inspector p-stack" aria-label="Campaign facts">
      <p class="p-row">
        <PBadge :tone="deadlineState(c).tone" :icon="deadlineState(c).icon">{{ deadlineState(c).label }}</PBadge>
        <PBadge :icon="platformIcon(c.platform)">{{ platformLabel(c.platform) }}</PBadge>
      </p>
      <dl class="facts">
        <div><dt><Icon icon="lucide:wallet" aria-label="Budget" /></dt><dd>{{ usdShort(c.budgetCents) }} Budget</dd></div>
        <div><dt><Icon icon="lucide:target" aria-label="Target CPM" /></dt><dd>{{ usd(c.targetCpmCents) }} Target CPM</dd></div>
        <div><dt><Icon icon="lucide:calendar-clock" aria-label="Bidding Deadline" /></dt><dd>{{ when(c.deadline) }}</dd></div>
      </dl>
      <h2 class="p-xs muted sub">
        Requirements
      </h2>
      <ul class="checks p-small">
        <li v-for="r in c.checks" :key="r.label" :title="`you: ${r.you}`">
          <Icon :icon="r.passed ? 'lucide:check' : 'lucide:x'" :class="r.passed ? 'p-ico-ok' : 'p-ico-bad'" aria-hidden="true" />
          <span class="visually-hidden">{{ r.passed ? 'Met:' : 'Not met:' }}</span>{{ r.need }}
        </li>
      </ul>
      <h2 class="p-xs muted sub">
        {{ c.bid?.scoreFactors ? `Score ${c.bid.score}` : `Relevance ${c.relevance}` }}
      </h2>
      <PFactors :factors="c.bid?.scoreFactors ?? c.relevanceFactors" />
    </aside>
  </div>
</template>

<style scoped>
.split { display: grid; grid-template-columns: minmax(0, 1fr) 17rem; gap: var(--space-lg); align-items: start; }
@media (width < 70rem) { .split { grid-template-columns: 1fr; } }
.head { gap: var(--space-2xs); }
.brief { max-inline-size: 60ch; color: var(--color-text-secondary); }
.inspector { position: sticky; inset-block-start: 4.5rem; gap: var(--space-sm); }
.facts { display: grid; gap: var(--space-2xs); font-size: var(--font-size-sm); }
.facts > div { display: grid; grid-template-columns: 1.25rem 1fr; align-items: center; }
.facts dt { color: var(--color-text-muted); }
.sub { text-transform: uppercase; letter-spacing: 0.05em; }
.checks { list-style: none; padding: 0; display: grid; gap: 2px; }
.checks li { display: flex; align-items: center; gap: var(--space-2xs); }
</style>
