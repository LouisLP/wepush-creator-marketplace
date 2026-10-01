import type { CampaignPreview, CampaignPreviewBody } from '@wepush/contracts'
import type { Ref } from 'vue'
import { CampaignPreviewBodySchema, previewCampaign } from '@wepush/contracts'
import { onScopeDispose, shallowRef, watch } from 'vue'
import { call, errorMessage } from '@/api'

const DEBOUNCE_MS = 300

/** Refetches the Create Campaign preview whenever the proposed terms settle; stale requests are aborted. */
export function useCampaignPreview(terms: Ref<CampaignPreviewBody>) {
  const preview = shallowRef<CampaignPreview>()
  const error = shallowRef<string>()
  const incomplete = shallowRef(false)
  const loading = shallowRef(false)

  let timer: ReturnType<typeof setTimeout> | undefined
  let inFlight: AbortController | undefined

  async function load(body: CampaignPreviewBody) {
    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller
    loading.value = true
    try {
      preview.value = await call(previewCampaign, { body, signal: controller.signal })
      error.value = undefined
    }
    catch (e) {
      if (!controller.signal.aborted)
        error.value = errorMessage(e)
    }
    finally {
      if (inFlight === controller)
        loading.value = false
    }
  }

  watch(terms, (value) => {
    clearTimeout(timer)
    const parsed = CampaignPreviewBodySchema.safeParse(value)
    incomplete.value = !parsed.success
    if (parsed.success)
      timer = setTimeout(load, DEBOUNCE_MS, value)
  }, { immediate: true, deep: true })

  onScopeDispose(() => {
    clearTimeout(timer)
    inFlight?.abort()
  })

  return { preview, error, incomplete, loading }
}
