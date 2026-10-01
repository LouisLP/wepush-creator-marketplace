<script setup lang="ts">
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'

const campaigns = useAdvertiserCampaignsStore()
</script>

<template>
  <section class="page" aria-labelledby="campaigns-heading">
    <h1 id="campaigns-heading">
      Campaigns
    </h1>
    <p v-if="campaigns.error" class="alert" role="alert">
      {{ campaigns.error }}
    </p>
    <p v-else-if="campaigns.items?.length === 0" class="muted">
      No campaigns yet. Create one to see which Creators it reaches and what they’d likely charge.
    </p>
    <p v-else class="muted">
      Pick a campaign from the list.
    </p>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-md);
  justify-items: start;
}
</style>
