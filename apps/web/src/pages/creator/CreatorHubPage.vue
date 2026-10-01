<script setup lang="ts">
import type { Creator } from '@wepush/contracts'
import { listCreators } from '@wepush/contracts'
import { useRouter } from 'vue-router'
import { call } from '@/api'
import HubIndex from '@/components/HubIndex.vue'
import AppBadge from '@/components/kit/AppBadge.vue'
import NewCreatorForm from '@/components/NewCreatorForm.vue'
import { useRequest } from '@/composables/useRequest.ts'
import { formatCategory, formatCount, formatPlatform } from '@/lib/format.ts'

const router = useRouter()
const creators = useRequest(() => call(listCreators))

const workspace = (c: Creator) => `/creators/${c.id}`
</script>

<template>
  <HubIndex
    heading="Creators"
    intro="TikTok and Instagram profiles that bid on matching Campaigns. Open one to act as it."
    noun="Creator"
    :items="creators.data.value?.items"
    :error="creators.error.value"
    :to="workspace"
  >
    <template #row="{ item }">
      <strong>{{ item.handle }}</strong>
      <span class="facts">
        <AppBadge>{{ formatPlatform(item.platform) }}</AppBadge>
        <AppBadge>{{ formatCategory(item.category) }}</AppBadge>
        <small class="muted">{{ formatCount(item.followers) }} followers</small>
      </span>
    </template>
    <template #form="{ close }">
      <NewCreatorForm @created="c => { close(); router.push(workspace(c)) }" />
    </template>
  </HubIndex>
</template>

<style scoped>
.facts {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
}
</style>
