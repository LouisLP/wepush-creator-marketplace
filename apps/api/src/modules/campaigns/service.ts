import type { NewCampaign } from '@wepush/db'
import type { AdvertiserId, DeadlineError, ProposedTerms } from '@wepush/domain'
import type { AppDeps } from '../../app.ts'
import { CAMPAIGN_LIMITS, checkBiddingDeadline, previewCampaign } from '@wepush/domain'
import { AppError } from '../../errors.ts'

function deadlineError(error: DeadlineError, now: Date): AppError {
  if (error === 'deadline_in_past')
    return new AppError('deadline_in_past', 'The Bidding Deadline must be in the future')
  const { min, max } = CAMPAIGN_LIMITS.biddingWindowMs
  return new AppError('deadline_out_of_range', 'The Bidding Deadline is outside the bidding window', {
    earliest: new Date(now.getTime() + min).toISOString(),
    latest: new Date(now.getTime() + max).toISOString(),
  })
}

export function createAdvertiserCampaignService({ repos, clock }: Pick<AppDeps, 'repos' | 'clock'>) {
  return {
    list: (advertiserId: AdvertiserId) => repos.campaigns.listByAdvertiser(advertiserId),

    async create(input: NewCampaign) {
      const now = clock.now()
      const deadline = checkBiddingDeadline(input.biddingDeadline, now)
      if (!deadline.ok)
        throw deadlineError(deadline.error, now)
      return { ...await repos.campaigns.create(input), bidCount: 0 }
    },

    async preview(terms: ProposedTerms) {
      return previewCampaign(await repos.creators.listProfilesOn(terms.requirements.platform), terms)
    },
  }
}
