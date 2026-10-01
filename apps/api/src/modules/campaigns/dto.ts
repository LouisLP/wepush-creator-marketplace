import type { AdvertiserCampaignSummary } from '@wepush/contracts'
import type { Campaign } from '@wepush/db'

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
