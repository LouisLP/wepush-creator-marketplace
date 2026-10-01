import { BID_STATUSES, CAMPAIGN_STATUSES, CATEGORIES, LOSS_REASONS, PLATFORMS } from '@wepush/domain'
import { pgEnum } from 'drizzle-orm/pg-core'

export const platform = pgEnum('platform', PLATFORMS)
export const category = pgEnum('category', CATEGORIES)
export const campaignStatus = pgEnum('campaign_status', CAMPAIGN_STATUSES)
export const bidStatus = pgEnum('bid_status', BID_STATUSES)
export const lossReason = pgEnum('loss_reason', LOSS_REASONS)
