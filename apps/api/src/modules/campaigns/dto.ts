import type { AdvertiserCampaignSummary, CampaignPreviewBodySchema, CreatorCampaign, MatchedCampaign } from '@wepush/contracts'
import type { Bid, Campaign } from '@wepush/db'
import type { ProposedTerms } from '@wepush/domain'
import type { z } from 'zod'
import type { AssessedCampaign } from './creator-service.ts'
import { cents } from '@wepush/domain'
import { toCreatorBid } from '../bids/dto.ts'

export function toAdvertiserCampaignSummary(c: Campaign & { bidCount: number }): AdvertiserCampaignSummary {
  return {
    id: c.id,
    title: c.title,
    platform: c.terms.requirements.platform,
    status: c.status,
    budgetCents: c.terms.budgetCents,
    biddingDeadline: c.terms.biddingDeadline.toISOString(),
    bidCount: c.bidCount,
    spentCents: c.outcome?.spentCents ?? null,
    createdAt: c.createdAt.toISOString(),
  }
}

export function toMatchedCampaign({ campaign: c, relevance, factors, feeQuote }: AssessedCampaign): MatchedCampaign {
  return {
    id: c.id,
    title: c.title,
    advertiserName: c.advertiserName,
    platform: c.terms.requirements.platform,
    budgetCents: c.terms.budgetCents,
    targetCpmCents: c.terms.targetCpmCents,
    biddingDeadline: c.terms.biddingDeadline.toISOString(),
    relevance: { value: relevance, factors },
    suggestedFeeCents: feeQuote.suggestedFeeCents,
  }
}

export function toCreatorCampaign(a: AssessedCampaign & Pick<CreatorCampaign, 'requirementChecks'> & { bid: Bid | null }): CreatorCampaign {
  const { campaign: c } = a
  return {
    id: c.id,
    title: c.title,
    advertiserName: c.advertiserName,
    brief: c.brief,
    status: c.status,
    requirements: c.terms.requirements,
    budgetCents: c.terms.budgetCents,
    targetCpmCents: c.terms.targetCpmCents,
    biddingDeadline: c.terms.biddingDeadline.toISOString(),
    requirementChecks: a.requirementChecks,
    relevance: { value: a.relevance, factors: a.factors },
    feeQuote: a.feeQuote,
    bid: a.bid && toCreatorBid(a.bid, c.outcome?.scoringVersion),
  }
}

export function toProposedTerms(body: z.output<typeof CampaignPreviewBodySchema>): ProposedTerms {
  return {
    requirements: {
      platform: body.platform,
      categories: body.categories,
      minFollowers: body.minFollowers,
      minEngagementRate: body.minEngagementRate,
    },
    budgetCents: cents(body.budgetCents),
    targetCpmCents: cents(body.targetCpmCents),
  }
}
