<script setup lang="ts">
// PROTOTYPE (#52) — throwaway variant switcher (from #22), keeps the rest of the query.
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{ variants: { key: string, name: string }[] }>()
const route = useRoute()
const router = useRouter()
const show = import.meta.env.DEV
const idx = computed(() => Math.max(0, props.variants.findIndex(v => v.key === route.query.variant)))
const current = computed(() => props.variants[idx.value]!)

function go(step: number) {
  const next = props.variants[(idx.value + step + props.variants.length) % props.variants.length]!
  void router.replace({ query: { ...route.query, variant: next.key } })
}
function onKey(e: KeyboardEvent) {
  if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]'))
    return
  if (e.key === 'ArrowLeft')
    go(-1)
  if (e.key === 'ArrowRight')
    go(1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="show" class="switcher">
    <button aria-label="Previous variant" @click="go(-1)">
      ←
    </button>
    <span>{{ current.key }} — {{ current.name }}</span>
    <button aria-label="Next variant" @click="go(1)">
      →
    </button>
  </div>
</template>

<style scoped>
.switcher { position: fixed; inset-block-end: 1rem; inset-inline-start: 50%; z-index: 100; display: flex; gap: 0.75rem; align-items: center; padding: 0.4rem 0.6rem; translate: -50% 0; border-radius: 999px; background: #ff0; color: #000; font: 600 0.85rem/1 system-ui; box-shadow: 0 4px 16px rgb(0 0 0 / 0.5); }
button { padding: 0.25rem 0.6rem; border: 0; border-radius: 999px; background: #000; color: #ff0; cursor: pointer; }
</style>
