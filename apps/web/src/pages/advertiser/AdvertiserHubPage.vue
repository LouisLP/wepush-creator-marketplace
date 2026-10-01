<script setup lang="ts">
import type { Advertiser } from '@wepush/contracts'
import { listAdvertisers } from '@wepush/contracts'
import { useRouter } from 'vue-router'
import { call } from '@/api'
import HubIndex from '@/components/HubIndex.vue'
import NewAdvertiserForm from '@/components/NewAdvertiserForm.vue'
import { useRequest } from '@/composables/useRequest.ts'

const router = useRouter()
const advertisers = useRequest(() => call(listAdvertisers))

const workspace = (a: Advertiser) => `/advertisers/${a.id}`
</script>

<template>
  <HubIndex
    heading="Advertisers"
    intro="Brands that run Campaigns and pick Winners. Open one to act as it."
    noun="Advertiser"
    :items="advertisers.data.value?.items"
    :error="advertisers.error.value"
    :to="workspace"
  >
    <template #row="{ item }">
      <strong>{{ item.name }}</strong>
    </template>
    <template #form="{ close }">
      <NewAdvertiserForm @created="a => { close(); router.push(workspace(a)) }" />
    </template>
  </HubIndex>
</template>
