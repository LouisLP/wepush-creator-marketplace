import type { CampaignId } from '@wepush/domain'
import type { CloseResult } from './close-campaigns.ts'
import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { runLoop } from './loop.ts'

const logger = pino({ level: 'silent' })
const id = (s: string) => s as CampaignId

describe('runLoop', () => {
  it('drains due campaigns, skips failures within the tick, and stops on abort', async () => {
    const controller = new AbortController()
    const results: CloseResult[] = [
      { kind: 'failed', campaignId: id('a'), error: new Error('boom') },
      { kind: 'closed', campaignId: id('b'), winners: 1, spentCents: 100 as never },
      { kind: 'idle' },
    ]
    const excludes: string[][] = []
    const sleeps: number[] = []

    await runLoop({
      closeNextDue: async (exclude) => {
        excludes.push([...exclude])
        return results.shift() ?? { kind: 'idle' }
      },
      sleep: async (ms) => {
        sleeps.push(ms)
        controller.abort()
      },
      signal: controller.signal,
      logger,
      intervalMs: 5000,
    })

    expect(excludes).toEqual([[], ['a'], ['a']])
    expect(sleeps).toEqual([5000])
  })

  it('does not start a tick once aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    let calls = 0

    await runLoop({
      closeNextDue: async () => {
        calls++
        return { kind: 'idle' }
      },
      sleep: async () => {},
      signal: controller.signal,
      logger,
      intervalMs: 1,
    })

    expect(calls).toBe(0)
  })

  it('survives an infra error and keeps ticking', async () => {
    const controller = new AbortController()
    let ticks = 0

    await runLoop({
      closeNextDue: async () => {
        ticks++
        throw new Error('db down')
      },
      sleep: async () => {
        if (ticks === 2)
          controller.abort()
      },
      signal: controller.signal,
      logger,
      intervalMs: 1,
    })

    expect(ticks).toBe(2)
  })
})
