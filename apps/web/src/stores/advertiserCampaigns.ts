import type { AdvertiserCampaignSummary } from '@wepush/contracts'
import { listAdvertiserCampaigns } from '@wepush/contracts'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { call, errorMessage } from '@/api'
import router, { actorIdIn } from '@/router'

/** The acting Advertiser's Campaigns, shared by the rail and the Campaign pages. */
export const useAdvertiserCampaignsStore = defineStore('advertiserCampaigns', () => {
  const items = shallowRef<AdvertiserCampaignSummary[]>()
  const error = shallowRef<string>()
  let loadedFor: string | undefined

  async function reload() {
    const advertiserId = actorIdIn(router.currentRoute.value, 'advertiser')
    if (advertiserId !== loadedFor) {
      items.value = undefined
      loadedFor = advertiserId
    }
    error.value = undefined
    try {
      const { items: next } = await call(listAdvertiserCampaigns)
      if (advertiserId === loadedFor)
        items.value = next
    }
    catch (e) {
      if (advertiserId === loadedFor)
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
