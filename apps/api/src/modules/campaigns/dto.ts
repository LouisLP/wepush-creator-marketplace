import type { AdvertiserCampaignSummary, CreatorCampaign, MatchedCampaign } from '@wepush/contracts'
import type { Campaign } from '@wepush/db'
import type { AssessedCampaign } from './creator-service.ts'

export function toAdvertiserCampaignSummary(c: Campaign): AdvertiserCampaignSummary {
  return {
    id: c.id,
    title: c.title,
    platform: c.terms.requirements.platform,
    status: c.status,
    budgetCents: c.terms.budgetCents,
    biddingDeadline: c.terms.biddingDeadline.toISOString(),
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

export function toCreatorCampaign(a: AssessedCampaign & Pick<CreatorCampaign, 'requirementChecks' | 'hasBid'>): CreatorCampaign {
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
    hasBid: a.hasBid,
  }
}
