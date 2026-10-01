<script setup lang="ts">
// PROTOTYPE (#52) — simplified screen layouts. Three variants across every screen via ?variant=A|B|C,
// screens via ?hub=&id=&c=. Static mock data: every Advertiser shows Acme Co's Campaigns, every Creator is @mia.cooks.
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import AdvertiserA from './AdvertiserA.vue'
import AdvertiserB from './AdvertiserB.vue'
import AdvertiserC from './AdvertiserC.vue'
import AdvRail from './AdvRail.vue'
import CreatorA from './CreatorA.vue'
import CreatorB from './CreatorB.vue'
import CreatorC from './CreatorC.vue'
import CreatorRail from './CreatorRail.vue'
import { advCampaigns, advertisers, creatorCampaigns, creators } from './fixtures.ts'
import HubIndex from './HubIndex.vue'
import PCrumbs from './PCrumbs.vue'
import PNavbar from './PNavbar.vue'
import PSwitcher from './PSwitcher.vue'
import { useProtoState } from './state.ts'
import './kit.css'

const { hub, id, campaign, variant } = useProtoState()
const isAdv = computed(() => hub.value === 'advertisers')
const actor = computed(() => (isAdv.value ? advertisers.find(a => a.id === id.value)?.name : creators.find(c => c.id === id.value)?.handle))
const advC = computed(() => advCampaigns.find(c => c.id === campaign.value))
const creC = computed(() => creatorCampaigns.find(c => c.id === campaign.value))
const campaignTitle = computed(() => (campaign.value === 'new' ? 'New Campaign' : (isAdv.value ? advC.value : creC.value)?.title))
const Adv = computed(() => ({ A: AdvertiserA, B: AdvertiserB, C: AdvertiserC })[variant.value] ?? AdvertiserA)
const Cre = computed(() => ({ A: CreatorA, B: CreatorB, C: CreatorC })[variant.value] ?? CreatorA)
</script>

<template>
  <PNavbar />
  <main class="content" :class="`v-${variant}`">
    <HubIndex v-if="!id" />
    <p v-else-if="!actor" class="p-empty">
      Not found. <RouterLink :to="{ query: { hub } }">
        Back to {{ hub }}
      </RouterLink>
    </p>
    <div v-else class="workspace">
      <PCrumbs :actor="actor" :campaign="campaignTitle" class="crumbs" />
      <aside class="rail">
        <AdvRail v-if="isAdv" />
        <CreatorRail v-else />
      </aside>
      <div class="pane">
        <p v-if="campaign === 'new'" class="p-empty">
          New Campaign page — out of scope for this prototype.
        </p>
        <component :is="Adv" v-else-if="isAdv && advC" :key="advC.id" :c="advC" />
        <component :is="Cre" v-else-if="!isAdv && creC" :key="creC.id" :c="creC" />
        <div v-else class="p-empty">
          <Icon icon="lucide:mouse-pointer-click" width="28" aria-hidden="true" />
          <p>{{ isAdv ? 'Pick a Campaign, or create one.' : 'Pick a Matched Campaign to review and bid.' }}</p>
        </div>
      </div>
    </div>
  </main>
  <PSwitcher :variants="[{ key: 'A', name: 'Glance + disclosures' }, { key: 'B', name: 'Tabs + segmented rails' }, { key: 'C', name: 'Inspector aside' }]" />
</template>

<style scoped>
.content { max-inline-size: 76rem; margin-inline: auto; padding: var(--space-lg) var(--space-gutter) var(--space-4xl); }
.content.v-C { max-inline-size: 92rem; }
.workspace { display: grid; grid-template-columns: 16rem minmax(0, 1fr); gap: var(--space-xs) var(--space-xl); align-items: start; }
.crumbs { grid-column: 1 / -1; }
.rail { position: sticky; inset-block-start: 4.5rem; }
.v-C .workspace { grid-template-columns: 14rem minmax(0, 1fr); }
@media (width < 48rem) {
  .workspace { grid-template-columns: 1fr; }
  .rail { position: static; }
}
</style>
