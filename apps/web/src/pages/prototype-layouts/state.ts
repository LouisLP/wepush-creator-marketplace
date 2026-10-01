// PROTOTYPE (#52) — all screen state lives in the query so every view is a shareable URL.
import type { LocationQueryRaw } from 'vue-router'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export type Hub = 'advertisers' | 'creators'

export function useProtoState() {
  const route = useRoute()
  const q = (k: string) => (typeof route.query[k] === 'string' ? route.query[k] as string : undefined)
  const hub = computed<Hub>(() => (q('hub') === 'creators' ? 'creators' : 'advertisers'))
  const id = computed(() => q('id'))
  const campaign = computed(() => q('c'))
  const variant = computed(() => q('variant') ?? 'A')

  function to(next: { hub?: Hub, id?: string | null, c?: string | null }) {
    const query: LocationQueryRaw = { ...route.query }
    for (const [k, v] of Object.entries(next)) {
      if (v === null)
        delete query[k]
      else if (v !== undefined)
        query[k] = v
    }
    if (next.hub)
      delete query.id
    if (next.hub || next.id === null)
      delete query.c
    return { path: route.path, query }
  }

  return { hub, id, campaign, variant, to }
}
