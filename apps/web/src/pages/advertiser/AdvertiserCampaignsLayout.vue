<script setup lang="ts">
import CampaignRail from '@/components/advertiser/CampaignRail.vue'
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'

void useAdvertiserCampaignsStore().reload()
</script>

<template>
  <div class="layout">
    <aside>
      <CampaignRail />
    </aside>
    <RouterView />
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
  gap: var(--space-xl);
  align-items: start;
}

aside {
  position: sticky;
  top: var(--space-md);
}

@media (width < 48rem) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  aside {
    position: static;
  }
}
</style>
