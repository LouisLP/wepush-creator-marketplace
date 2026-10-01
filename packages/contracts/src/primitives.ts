import { BID_STATUSES, CAMPAIGN_STATUSES, CATEGORIES, PLATFORMS } from '@wepush/domain'
import { z } from 'zod'

export type { BidStatus, CampaignStatus, Category, Platform } from '@wepush/domain'

export const IdSchema = z.uuid()
export const CentsSchema = z.int().positive().max(Number.MAX_SAFE_INTEGER)
export const IsoDateTimeSchema = z.iso.datetime()
export const EngagementRateSchema = z.number().min(0).max(1)

export const PlatformSchema = z.enum(PLATFORMS)
export const CategorySchema = z.enum(CATEGORIES)
export const CampaignStatusSchema = z.enum(CAMPAIGN_STATUSES)
export const BidStatusSchema = z.enum(BID_STATUSES)

export const listOf = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item) })
