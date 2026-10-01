<script setup lang="ts">
import MatchedCampaignRail from '@/components/MatchedCampaignRail.vue'
</script>

<template>
  <div class="workspace">
    <MatchedCampaignRail class="rail" />
    <div class="pane">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.workspace {
  display: grid;
  grid-template-columns: minmax(16rem, 20rem) minmax(0, 1fr);
  gap: var(--space-xl);
  align-items: start;
}

.rail {
  position: sticky;
  top: var(--space-md);
}

@media (width < 48rem) {
  .workspace {
    grid-template-columns: minmax(0, 1fr);
  }

  .rail {
    position: static;
  }
}
</style>
