import type { AdvertiserCampaignSummary } from '@wepush/contracts'
import { listAdvertiserCampaigns } from '@wepush/contracts'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { call, errorMessage } from '@/api'

/** The acting Advertiser's Campaigns, shared by the rail and the Campaign pages. */
export const useAdvertiserCampaignsStore = defineStore('advertiserCampaigns', () => {
  const items = shallowRef<AdvertiserCampaignSummary[]>()
  const error = shallowRef<string>()

  async function reload() {
    error.value = undefined
    try {
      items.value = (await call(listAdvertiserCampaigns)).items
    }
    catch (e) {
      error.value = errorMessage(e)
    }
  }

  return {
    items,
    error,
    reload,
    open: computed(() => items.value?.filter(c => c.status === 'open') ?? []),
    closed: computed(() => items.value?.filter(c => c.status === 'closed') ?? []),
    byId: (id: string) => items.value?.find(c => c.id === id),
  }
})
