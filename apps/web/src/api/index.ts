import router from '@/router'
import { useIdentityStore } from '@/stores/identity.ts'
import { createApiClient } from './client.ts'

export { ApiError } from './client.ts'
export { fieldErrors, messageFor } from './messages.ts'

export const call = createApiClient({
  actorIdFor: role => useIdentityStore().get(role)?.id,
  onActorRejected: (role) => {
    useIdentityStore().clear(role)
    void router.push({ path: '/', query: { role } })
  },
})
