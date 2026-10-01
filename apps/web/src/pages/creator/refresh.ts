import type { InjectionKey } from 'vue'
import { inject } from 'vue'

/** Provided by CreatorWorkspace so the pane can refresh the rail after a Bid changes. */
export const REFRESH_RAIL: InjectionKey<() => void> = Symbol('refresh-rail')

export const useRefreshRail = () => inject(REFRESH_RAIL, () => {})
