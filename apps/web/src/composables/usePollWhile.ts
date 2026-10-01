import { onUnmounted } from 'vue'

/** Matches the worker's default close poll, so outcomes show up within a tick or two. */
export const OUTCOME_POLL_MS = 5_000

/** Calls `tick` every `intervalMs` while `shouldPoll()` holds; stops on unmount. */
export function usePollWhile(shouldPoll: () => boolean, tick: () => unknown, intervalMs = OUTCOME_POLL_MS) {
  const id = setInterval(() => {
    if (shouldPoll())
      void tick()
  }, intervalMs)
  onUnmounted(() => clearInterval(id))
}

export const isPastDeadline = (iso: string) => Date.now() >= Date.parse(iso)
