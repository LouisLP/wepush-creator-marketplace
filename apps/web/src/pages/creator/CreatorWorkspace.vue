<script setup lang="ts">
import { provide, useTemplateRef } from 'vue'
import MatchedCampaignRail from '@/components/MatchedCampaignRail.vue'
import MyBidsRail from '@/components/MyBidsRail.vue'
import { REFRESH_RAIL } from './refresh.ts'

const matched = useTemplateRef('matched')
const myBids = useTemplateRef('myBids')

provide(REFRESH_RAIL, () => {
  void matched.value?.reload()
  void myBids.value?.reload()
})
</script>

<template>
  <div class="workspace">
    <aside class="rail">
      <MatchedCampaignRail ref="matched" />
      <MyBidsRail ref="myBids" />
    </aside>
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
  display: grid;
  gap: var(--space-xl);
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
