import type { CampaignWithAdvertiser } from '@wepush/db'
import type { CampaignId, CreatorId, CreatorProfile } from '@wepush/domain'
import type { AppDeps } from '../../app.ts'
import { byRelevance, canReviewCampaign, checkRequirements, feeQuote, isMatchedCampaign, relevance } from '@wepush/domain'
import { AppError } from '../../errors.ts'

function assess(profile: CreatorProfile, campaign: CampaignWithAdvertiser) {
  return {
    campaign,
    terms: campaign.terms,
    ...relevance(profile, campaign.terms),
    feeQuote: feeQuote(profile, campaign.terms),
  }
}
export type AssessedCampaign = ReturnType<typeof assess>

export function createCreatorCampaignService({ repos, clock }: Pick<AppDeps, 'repos' | 'clock'>) {
  async function profileOf(creatorId: CreatorId) {
    const creator = await repos.creators.getById(creatorId)
    if (!creator)
      throw new AppError('not_found', 'Creator not found')
    return creator.profile
  }

  return {
    async listMatched(creatorId: CreatorId) {
      const profile = await profileOf(creatorId)
      const now = clock.now()
      const candidates = await repos.campaigns.listMatchCandidates({ creatorId, platform: profile.platform, now })
      return candidates
        .filter(c => isMatchedCampaign(profile, c, now))
        .map(c => assess(profile, c))
        .sort(byRelevance)
    },

    async getForReview(creatorId: CreatorId, campaignId: CampaignId) {
      const [profile, campaign, bid] = await Promise.all([
        profileOf(creatorId),
        repos.campaigns.getWithAdvertiser(campaignId),
        repos.bids.findByCampaignAndCreator(campaignId, creatorId),
      ])
      if (!campaign || !canReviewCampaign(profile, campaign, !!bid, clock.now()))
        throw new AppError('not_found', 'Campaign not found')
      return {
        ...assess(profile, campaign),
        requirementChecks: checkRequirements(profile, campaign.terms.requirements),
        bid: bid ?? null,
      }
    },
  }
}
