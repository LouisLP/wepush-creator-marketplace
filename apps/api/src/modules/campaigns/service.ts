import type { CampaignBid, NewCampaign } from '@wepush/db'
import type { AdvertiserId, CampaignId, DeadlineError, ProposedTerms } from '@wepush/domain'
import type { AppDeps } from '../../app.ts'
import { CAMPAIGN_LIMITS, checkBiddingDeadline, closeCampaign, previewCampaign, summarizeWinners } from '@wepush/domain'
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

    /** Open: what Closing would decide now (provisional). Closed: the recorded outcome. */
    async review(advertiserId: AdvertiserId, campaignId: CampaignId) {
      const campaign = await repos.campaigns.getById(campaignId)
      if (!campaign || campaign.advertiserId !== advertiserId)
        throw new AppError('not_found', 'Campaign not found')

      const bids = await repos.bids.listForCampaign(campaignId)
      const { scoringVersion, outcomes } = campaign.outcome
        ? { scoringVersion: campaign.outcome.scoringVersion, outcomes: bids.map(recordedOutcome) }
        : closeCampaign(campaign.terms, bids.map(b => b.bid))

      const byId = new Map(bids.map(b => [b.bid.id, b]))
      const ranked = outcomes
        .map(outcome => ({ ...byId.get(outcome.bidId)!, outcome }))
        .sort((a, b) => a.outcome.rank - b.outcome.rank)

      return {
        campaign,
        provisional: !campaign.outcome,
        scoringVersion,
        bids: ranked,
        summary: summarizeWinners(ranked.filter(r => r.outcome.status === 'won').map(r => r.bid)),
      }
    },
  }
}
export type CampaignReview = Awaited<ReturnType<ReturnType<typeof createAdvertiserCampaignService>['review']>>

function recordedOutcome({ bid, recorded }: CampaignBid) {
  if (!recorded)
    throw new Error(`Closed campaign has unrecorded bid ${bid.id}`)
  return recorded
}
