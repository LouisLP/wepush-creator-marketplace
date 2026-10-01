<script setup lang="ts">
// PROTOTYPE (#52) — create dialog on the real AppDialog. Stub: lands on an existing actor.
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/kit/AppButton.vue'
import AppDialog from '@/components/kit/AppDialog.vue'
import { useProtoState } from './state.ts'

const props = defineProps<{ kind: 'advertisers' | 'creators' }>()
const router = useRouter()
const { to } = useProtoState()
const noun = props.kind === 'advertisers' ? 'Advertiser' : 'Creator'

function submit(close: () => void) {
  close()
  void router.push(to({ id: props.kind === 'advertisers' ? 'a1' : 'c1' }))
}
</script>

<template>
  <AppDialog :title="`New ${noun}`" :description="kind === 'advertisers' ? 'Name it — you can create Campaigns next.' : 'Profile used for matching and Bid Snapshots.'">
    <template #trigger>
      <AppButton><Icon icon="lucide:plus" aria-hidden="true" /> New {{ noun }}</AppButton>
    </template>
    <template #default="{ close }">
      <form class="p-stack" @submit.prevent="submit(close)">
        <template v-if="kind === 'advertisers'">
          <label class="field"><span>Name</span><input placeholder="Acme Co" required></label>
        </template>
        <template v-else>
          <label class="field"><span>Handle</span><input placeholder="@mia.cooks" required></label>
          <div class="row">
            <label class="field"><span>Platform</span><select><option>Instagram</option><option>TikTok</option></select></label>
            <label class="field"><span>Category</span><select><option>food</option><option>fitness</option><option>beauty</option></select></label>
          </div>
          <div class="row">
            <label class="field"><span>Followers</span><input type="number" value="48000"></label>
            <label class="field"><span>Engagement %</span><input type="number" step="0.1" value="3.1"></label>
          </div>
        </template>
        <footer class="p-row actions">
          <AppButton variant="ghost" @click="close">
            Cancel
          </AppButton>
          <button class="btn">
            Create
          </button>
        </footer>
      </form>
    </template>
  </AppDialog>
</template>

<style scoped>
.row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); }
.actions { justify-content: flex-end; }
</style>
