<script setup lang="ts">
// PROTOTYPE (#52) — Creator Campaign, variant B "Tabs": Bid | Fit | Brief & Terms; the first tab follows the step.
import type { CreatorCampaign } from './fixtures.ts'
import { Icon } from '@iconify/vue'
import { ref, watch } from 'vue'
import { deadlineState, platformIcon, platformLabel, step, usd, usdShort, when } from './fixtures.ts'
import PBadge from './PBadge.vue'
import PCreatorAction from './PCreatorAction.vue'
import PFactors from './PFactors.vue'
import PSteps from './PSteps.vue'

const props = defineProps<{ c: CreatorCampaign }>()
const tab = ref<'bid' | 'fit' | 'brief'>('bid')
watch(() => props.c.id, () => (tab.value = 'bid'))
</script>

<template>
  <article class="p-stack">
    <header class="card head">
      <div class="p-stack title">
        <h1>{{ c.title }}</h1>
        <p class="p-row">
          <span class="muted">{{ c.advertiser }}</span>
          <PBadge :tone="deadlineState(c).tone" :icon="deadlineState(c).icon">{{ deadlineState(c).label }}</PBadge>
          <PBadge :icon="platformIcon(c.platform)">{{ platformLabel(c.platform) }}</PBadge>
        </p>
      </div>
      <dl class="p-kpis nums">
        <div><dt>Relevance</dt><dd>{{ c.relevance }}</dd></div>
        <div><dt>Budget</dt><dd>{{ usdShort(c.budgetCents) }}</dd></div>
        <div><dt>Target CPM</dt><dd>{{ usd(c.targetCpmCents) }}</dd></div>
      </dl>
      <PSteps :current="step(c)" />
    </header>

    <div class="p-tabs" role="tablist">
      <button role="tab" :aria-selected="tab === 'bid'" @click="tab = 'bid'">
        <Icon icon="lucide:gavel" aria-hidden="true" /> {{ c.bid ? 'Your Bid' : 'Bid' }}
      </button>
      <button role="tab" :aria-selected="tab === 'fit'" @click="tab = 'fit'">
        <Icon icon="lucide:sparkles" aria-hidden="true" /> Fit
        <Icon :icon="c.checks.every(r => r.passed) ? 'lucide:check' : 'lucide:x'" :class="c.checks.every(r => r.passed) ? 'p-ico-ok' : 'p-ico-bad'" aria-hidden="true" />
      </button>
      <button role="tab" :aria-selected="tab === 'brief'" @click="tab = 'brief'">
        <Icon icon="lucide:file-text" aria-hidden="true" /> Brief & Terms
      </button>
    </div>

    <section v-if="tab === 'bid'" role="tabpanel">
      <PCreatorAction :c="c" show-factors />
    </section>
    <section v-else-if="tab === 'fit'" role="tabpanel" class="p-stack">
      <ul class="checks">
        <li v-for="r in c.checks" :key="r.label">
          <Icon :icon="r.passed ? 'lucide:check' : 'lucide:x'" :class="r.passed ? 'p-ico-ok' : 'p-ico-bad'" aria-hidden="true" />
          <span class="visually-hidden">{{ r.passed ? 'Met:' : 'Not met:' }}</span>
          <span>{{ r.label }} {{ r.need }}</span>
          <small class="muted">you {{ r.you }}</small>
        </li>
      </ul>
      <h3 class="p-small">
        Relevance {{ c.relevance }}
      </h3>
      <PFactors :factors="c.relevanceFactors" />
    </section>
    <section v-else role="tabpanel" class="p-stack">
      <p class="brief">
        {{ c.brief }}
      </p>
      <p class="p-row p-small muted">
        <span><Icon icon="lucide:calendar-clock" aria-hidden="true" /> {{ when(c.deadline) }}</span>
        <span>1 Post</span>
        <PBadge v-for="cat in c.categories" :key="cat">{{ cat }}</PBadge>
      </p>
    </section>
  </article>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: start; gap: var(--space-lg); }
.title { gap: var(--space-xs); }
.nums { grid-template-columns: repeat(3, auto); }
.checks { list-style: none; padding: 0; display: grid; gap: var(--space-2xs); }
.checks li { display: flex; align-items: center; gap: var(--space-xs); }
.brief { max-inline-size: 60ch; }
</style>
