import type { CampaignId, Cents, CreatorId, PlacementError } from '@wepush/domain'
import type { AppDeps } from '../../app.ts'
import { UniqueViolationError } from '@wepush/db'
import { checkBidPlacement } from '@wepush/domain'
import { AppError } from '../../errors.ts'

const dollars = (c: Cents) => `$${(c / 100).toFixed(2)}`

function toAppError(e: PlacementError): AppError {
  switch (e.code) {
    case 'campaign_closed': return new AppError('campaign_closed', 'This Campaign is closed')
    case 'deadline_passed': return new AppError('deadline_passed', 'The Bidding Deadline has passed')
    case 'already_bid': return new AppError('already_bid', 'You have already bid on this Campaign')
    case 'requirements_not_met': return new AppError('requirements_not_met', 'Your profile does not meet the Requirements', { checks: e.checks })
    case 'fee_out_of_range': return new AppError('fee_out_of_range', `Fee must be between ${dollars(e.minCents)} and ${dollars(e.maxCents)}`, { minCents: e.minCents, maxCents: e.maxCents })
  }
}

export function createCreatorBidService({ repos, uow, clock }: Pick<AppDeps, 'repos' | 'uow' | 'clock'>) {
  return {
    listMine: (creatorId: CreatorId) => repos.bids.listByCreator(creatorId),

    place(creatorId: CreatorId, campaignId: CampaignId, feeCents: Cents) {
      return uow.run(async (tx) => {
        const campaign = await tx.campaigns.lockForBidding(campaignId)
        const creator = await tx.creators.getById(creatorId)
        if (!campaign || !creator)
          throw new AppError('not_found', 'Campaign not found')

        const now = clock.now()
        const placement = checkBidPlacement({
          creator: creator.profile,
          campaign,
          feeCents,
          now,
          alreadyBid: !!(await tx.bids.findByCampaignAndCreator(campaignId, creatorId)),
        })
        if (!placement.ok)
          throw toAppError(placement.error)

        try {
          return await tx.bids.place({ campaignId, creatorId, feeCents, placedAt: now, snapshot: placement.value })
        }
        catch (e) {
          if (e instanceof UniqueViolationError && e.constraint === 'bids_campaign_creator_unique')
            throw toAppError({ code: 'already_bid' })
          throw e
        }
      })
    },
  }
}
