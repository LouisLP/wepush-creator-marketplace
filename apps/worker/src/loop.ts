import type { CampaignId } from '@wepush/domain'
import type { Logger } from 'pino'
import type { CloseResult } from './close-campaigns.ts'
import { randomUUID } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'

export interface LoopDeps {
  closeNextDue: (exclude: ReadonlySet<CampaignId>) => Promise<CloseResult>
  sleep: (ms: number, signal: AbortSignal) => Promise<void>
  signal: AbortSignal
  logger: Logger
  intervalMs: number
}

export async function sleep(ms: number, signal: AbortSignal) {
  await setTimeout(ms, undefined, { signal }).catch(() => {})
}

/** Drains all due Campaigns, then sleeps; stops after the in-flight close once `signal` aborts. */
export async function runLoop(deps: LoopDeps) {
  while (!deps.signal.aborted) {
    await tick(deps)
    await deps.sleep(deps.intervalMs, deps.signal)
  }
}

async function tick({ closeNextDue, signal, logger }: LoopDeps) {
  const log = logger.child({ runId: randomUUID() })
  const exclude = new Set<CampaignId>()
  let closed = 0
  try {
    while (!signal.aborted) {
      const result = await closeNextDue(exclude)
      if (result.kind === 'idle')
        break
      if (result.kind === 'closed') {
        closed++
        log.info({ campaignId: result.campaignId, winners: result.winners, spentCents: result.spentCents }, 'campaign closed')
      }
      else {
        exclude.add(result.campaignId)
        log.error({ err: result.error, campaignId: result.campaignId }, 'campaign close failed')
      }
    }
    log.debug({ closed, failed: exclude.size }, 'tick done')
  }
  catch (err) {
    log.error({ err }, 'tick aborted')
  }
}
