export const PLATFORMS = ['tiktok', 'instagram'] as const
export type Platform = (typeof PLATFORMS)[number]

export const CATEGORIES = [
  'beauty',
  'fashion',
  'fitness',
  'food',
  'gaming',
  'tech',
  'travel',
  'lifestyle',
  'finance',
  'parenting',
] as const
export type Category = (typeof CATEGORIES)[number]

export const CAMPAIGN_STATUSES = ['open', 'closed'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export const BID_STATUSES = ['pending', 'won', 'lost'] as const
export type BidStatus = (typeof BID_STATUSES)[number]

// In precedence order: the first that applies is the one given.
export const LOSS_REASONS = ['requirements_not_met', 'fee_out_of_range', 'over_budget'] as const
export type LossReason = (typeof LOSS_REASONS)[number]
