import type { Ref } from 'vue'
import { shallowRef } from 'vue'
import { ApiError, messageFor } from '@/api'

/** Runs a request immediately and exposes its state; call `reload()` to refetch. */
export function useRequest<T>(fetcher: () => Promise<T>) {
  const data: Ref<T | undefined> = shallowRef()
  const error = shallowRef<string>()
  const loading = shallowRef(false)

  async function reload() {
    loading.value = true
    error.value = undefined
    try {
      data.value = await fetcher()
    }
    catch (e) {
      error.value = e instanceof ApiError ? messageFor(e) : 'Something went wrong.'
    }
    finally {
      loading.value = false
    }
  }

  void reload()
  return { data, error, loading, reload }
}
