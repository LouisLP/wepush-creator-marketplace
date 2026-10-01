import type { Role } from '@/api/client.ts'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Identity {
  id: string
  name: string
}

type Slots = Record<Role, Identity | null>

const STORAGE_KEY = 'wepush.identity'

function load(): Slots {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return { advertiser: parsed?.advertiser ?? null, creator: parsed?.creator ?? null }
  }
  catch {
    return { advertiser: null, creator: null }
  }
}

export const useIdentityStore = defineStore('identity', () => {
  const slots = ref<Slots>(load())

  watch(slots, (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    }
    catch {}
  }, { deep: true })

  return {
    slots,
    get: (role: Role) => slots.value[role],
    set: (role: Role, identity: Identity) => { slots.value[role] = identity },
    clear: (role: Role) => { slots.value[role] = null },
  }
})
