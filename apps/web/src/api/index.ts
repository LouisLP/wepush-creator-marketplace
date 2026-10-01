import { shallowRef } from 'vue'
import router, { actorIdIn } from '@/router'
import { createApiClient } from './client.ts'

export { ApiError } from './client.ts'
export { errorMessage, feeRangeMessage, fieldErrors, formErrorFor, messageFor } from './messages.ts'

/** Actor id from the URL that the API refused (unknown or malformed); its workspace shows not-found. */
export const rejectedActorId = shallowRef<string>()

export const call = createApiClient({
  actorIdFor: role => actorIdIn(router.currentRoute.value, role),
  onActorRejected: (role) => {
    rejectedActorId.value = actorIdIn(router.currentRoute.value, role)
  },
})
