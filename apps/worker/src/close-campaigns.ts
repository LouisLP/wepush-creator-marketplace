import type { UnitOfWork } from '@wepush/db'
import type { CampaignId, Cents, Clock } from '@wepush/domain'
import { closeCampaign } from '@wepush/domain'

export type CloseResult
  = | { kind: 'idle' }
    | { kind: 'closed', campaignId: CampaignId, winners: number, spentCents: Cents }
    | { kind: 'failed', campaignId: CampaignId, error: unknown }

export interface CloseDeps {
  uow: UnitOfWork
  clock: Clock
}

/**
 * Claims and closes one due Campaign in a single transaction.
 * Throws only for failures before a Campaign was claimed (e.g. DB unavailable).
 */
export async function closeNextDue({ uow, clock }: CloseDeps, exclude: ReadonlySet<CampaignId>): Promise<CloseResult> {
  let claimed: CampaignId | undefined
  try {
    return await uow.run(async (repos) => {
      const campaign = await repos.campaigns.claimNextDue(clock.now(), [...exclude])
      if (!campaign)
        return { kind: 'idle' }
      claimed = campaign.id

      const bids = await repos.bids.listPending(campaign.id)
      const outcome = closeCampaign(campaign.terms, bids)
      await repos.bids.recordOutcomes(outcome.outcomes)
      await repos.campaigns.markClosed({
        id: campaign.id,
        spentCents: outcome.spentCents,
        closedAt: clock.now(),
        scoringVersion: outcome.scoringVersion,
      })

      return {
        kind: 'closed',
        campaignId: campaign.id,
        winners: outcome.outcomes.filter(o => o.status === 'won').length,
        spentCents: outcome.spentCents,
      }
    })
  }
  catch (error) {
    if (claimed)
      return { kind: 'failed', campaignId: claimed, error }
    throw error
  }
}
