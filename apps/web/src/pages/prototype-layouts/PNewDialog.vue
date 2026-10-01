<script setup lang="ts">
// PROTOTYPE (#52) — create dialog (native <dialog>; real build uses Reka Dialog per #56). Stub: lands on an existing actor.
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProtoState } from './state.ts'

const props = defineProps<{ kind: 'advertisers' | 'creators' }>()
const el = ref<HTMLDialogElement>()
const router = useRouter()
const { to } = useProtoState()

defineExpose({ open: () => el.value?.showModal() })

function submit() {
  el.value?.close()
  void router.push(to({ id: props.kind === 'advertisers' ? 'a1' : 'c1' }))
}
</script>

<template>
  <dialog ref="el" class="dialog" aria-labelledby="new-heading" @click.self="el?.close()">
    <form class="p-stack" @submit.prevent="submit">
      <header class="head">
        <h2 id="new-heading">
          {{ kind === 'advertisers' ? 'New Advertiser' : 'New Creator' }}
        </h2>
        <button type="button" class="p-iconbtn" aria-label="Close" @click="el?.close()">
          <Icon icon="lucide:x" width="18" />
        </button>
      </header>
      <template v-if="kind === 'advertisers'">
        <label class="field"><span>Name</span><input placeholder="Acme Co" required autofocus></label>
      </template>
      <template v-else>
        <label class="field"><span>Handle</span><input placeholder="@mia.cooks" required autofocus></label>
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
        <button type="button" class="btn btn-ghost" @click="el?.close()">
          Cancel
        </button>
        <button class="btn">
          Create
        </button>
      </footer>
    </form>
  </dialog>
</template>

<style scoped>
.dialog { inline-size: min(28rem, calc(100vw - 2rem)); margin: auto; padding: var(--space-lg); border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); background: var(--color-bg-surface); color: var(--color-text-primary); box-shadow: var(--shadow-lg); }
.dialog::backdrop { background: oklch(0% 0 0 / 0.5); }
.head { display: flex; align-items: center; justify-content: space-between; }
h2 { font-size: var(--font-size-lg); }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); }
.actions { justify-content: flex-end; }
</style>
