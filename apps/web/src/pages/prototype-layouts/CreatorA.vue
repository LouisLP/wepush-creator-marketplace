<script setup lang="ts">
// PROTOTYPE (#52) — Creator Campaign, variant A "Glance + disclosures": action card first, fit as one row of chips, the rest collapsed.
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
  <article class="p-stack">
    <header class="p-stack head">
      <h1>{{ c.title }}</h1>
      <p class="p-row">
        <span class="muted">{{ c.advertiser }}</span>
        <PBadge :tone="deadlineState(c).tone" :icon="deadlineState(c).icon">{{ deadlineState(c).label }}</PBadge>
        <PBadge :icon="platformIcon(c.platform)">{{ platformLabel(c.platform) }}</PBadge>
        <PSteps :current="step(c)" class="steps" />
      </p>
    </header>

    <section class="card p-stack" aria-labelledby="action-h">
      <h2 id="action-h">
        {{ c.bid ? 'Your Bid' : 'Place your Bid' }}
      </h2>
      <PCreatorAction :c="c" />
    </section>

    <p class="p-row fit">
      <PBadge :label="`Relevance ${c.relevance}`" icon="lucide:sparkles">Relevance {{ c.relevance }}</PBadge>
      <span v-for="r in c.checks" :key="r.label" class="check p-small" :title="`${r.label}: needs ${r.need}, you ${r.you}`">
        <Icon :icon="r.passed ? 'lucide:check' : 'lucide:x'" :class="r.passed ? 'p-ico-ok' : 'p-ico-bad'" aria-hidden="true" />
        <span class="visually-hidden">{{ r.passed ? 'Met:' : 'Not met:' }}</span>{{ r.need }}
      </span>
    </p>

    <details class="p-disclosure">
      <summary><Icon icon="lucide:chevron-right" class="p-chev" aria-hidden="true" /> Brief <span class="p-sum-meta muted p-small p-clamp">{{ c.brief }}</span></summary>
      <div class="p-body">
        <p>{{ c.brief }}</p>
      </div>
    </details>
    <details class="p-disclosure">
      <summary>
        <Icon icon="lucide:chevron-right" class="p-chev" aria-hidden="true" /> {{ c.bid?.scoreFactors ? 'Why this Score' : 'Why this Relevance' }}
        <span class="p-sum-meta muted p-small">{{ c.bid?.score ?? c.relevance }}</span>
      </summary>
      <div class="p-body">
        <PFactors :factors="c.bid?.scoreFactors ?? c.relevanceFactors" />
      </div>
    </details>
    <details class="p-disclosure">
      <summary>
        <Icon icon="lucide:chevron-right" class="p-chev" aria-hidden="true" /> Terms
        <span class="p-sum-meta muted p-small p-num">{{ usdShort(c.budgetCents) }} · {{ usd(c.targetCpmCents) }} CPM</span>
      </summary>
      <div class="p-body p-small">
        Budget {{ usdShort(c.budgetCents) }} · Target CPM {{ usd(c.targetCpmCents) }} · Deadline {{ when(c.deadline) }} · 1 Post · Categories {{ c.categories.join(', ') }}
      </div>
    </details>
  </article>
</template>

<style scoped>
.head { gap: var(--space-xs); }
.steps { margin-inline-start: auto; }
h2 { font-size: var(--font-size-lg); }
.fit { gap: var(--space-md); }
.check { display: inline-flex; align-items: center; gap: 0.2em; }
summary .p-clamp { -webkit-line-clamp: 1; max-inline-size: 40ch; }
</style>
