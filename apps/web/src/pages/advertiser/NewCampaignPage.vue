<script setup lang="ts">
import type { AdvertiserCampaignSummary } from '@wepush/contracts'
import { useRouter } from 'vue-router'
import CampaignForm from '@/components/advertiser/CampaignForm.vue'
import { useAdvertiserCampaignsStore } from '@/stores/advertiserCampaigns.ts'

const router = useRouter()
const campaigns = useAdvertiserCampaignsStore()

async function onCreated(campaign: AdvertiserCampaignSummary) {
  await campaigns.reload()
  await router.push({ name: 'advertiser-campaign', params: { id: campaign.id } })
}
</script>

<template>
  <section class="page" aria-labelledby="new-campaign-heading">
    <h1 id="new-campaign-heading">
      New Campaign
    </h1>
    <CampaignForm @created="onCreated" />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-lg);
}
</style>
