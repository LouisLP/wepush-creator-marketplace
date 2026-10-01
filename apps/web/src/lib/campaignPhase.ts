import type { CampaignStatus } from '@wepush/contracts'

export const CLOSING_SOON_MS = 24 * 3_600_000

/** `closing`: past the Bidding Deadline, waiting on the worker to Close it. */
export type CampaignPhase = 'open' | 'closing-soon' | 'closing' | 'closed'

export function campaignPhase(status: CampaignStatus, biddingDeadline: string, now = new Date()): CampaignPhase {
  if (status === 'closed')
    return 'closed'
  const ms = new Date(biddingDeadline).getTime() - now.getTime()
  if (ms <= 0)
    return 'closing'
  return ms < CLOSING_SOON_MS ? 'closing-soon' : 'open'
}
