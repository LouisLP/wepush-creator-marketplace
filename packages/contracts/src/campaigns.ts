import type { RelevanceFactorKey } from '@wepush/domain'
import { RELEVANCE_WEIGHTS } from '@wepush/domain'
import { z } from 'zod'
import { defineEndpoint } from './endpoint.ts'
import { RequirementCheckSchema } from './errors.ts'
import { CampaignStatusSchema, CategorySchema, CentsSchema, EngagementRateSchema, IdSchema, IsoDateTimeSchema, listOf, PlatformSchema } from './primitives.ts'

export const AdvertiserCampaignSummarySchema = z.object({
  id: IdSchema,
  title: z.string(),
  platform: PlatformSchema,
  status: CampaignStatusSchema,
  budgetCents: CentsSchema,
  biddingDeadline: IsoDateTimeSchema,
  createdAt: IsoDateTimeSchema,
})
export type AdvertiserCampaignSummary = z.infer<typeof AdvertiserCampaignSummarySchema>

export const listAdvertiserCampaigns = defineEndpoint({
  method: 'GET',
  path: '/api/advertiser/campaigns',
  response: listOf(AdvertiserCampaignSummarySchema),
})

export const RequirementsSchema = z.object({
  platform: PlatformSchema,
  categories: z.array(CategorySchema),
  minFollowers: z.int().nonnegative(),
  minEngagementRate: EngagementRateSchema.nullable(),
})
export type Requirements = z.infer<typeof RequirementsSchema>

const RELEVANCE_FACTOR_KEYS = Object.keys(RELEVANCE_WEIGHTS) as [RelevanceFactorKey, ...RelevanceFactorKey[]]

export const RelevanceFactorSchema = z.object({
  key: z.enum(RELEVANCE_FACTOR_KEYS),
  value: z.number().min(0).max(1),
  weight: z.number(),
  contribution: z.number(),
})
export type RelevanceFactor = z.infer<typeof RelevanceFactorSchema>

export const RelevanceSchema = z.object({
  value: z.int().min(0).max(100),
  factors: z.array(RelevanceFactorSchema),
})
export type Relevance = z.infer<typeof RelevanceSchema>

export const FeeQuoteSchema = z.object({
  estimatedImpressions: z.int().positive(),
  suggestedFeeCents: CentsSchema,
  minFeeCents: CentsSchema,
  maxFeeCents: CentsSchema,
})
export type FeeQuote = z.infer<typeof FeeQuoteSchema>

export const MatchedCampaignSchema = z.object({
  id: IdSchema,
  title: z.string(),
  advertiserName: z.string(),
  platform: PlatformSchema,
  budgetCents: CentsSchema,
  targetCpmCents: CentsSchema,
  biddingDeadline: IsoDateTimeSchema,
  relevance: RelevanceSchema,
  suggestedFeeCents: CentsSchema,
})
export type MatchedCampaign = z.infer<typeof MatchedCampaignSchema>

export const CreatorCampaignSchema = z.object({
  id: IdSchema,
  title: z.string(),
  advertiserName: z.string(),
  brief: z.string(),
  status: CampaignStatusSchema,
  requirements: RequirementsSchema,
  budgetCents: CentsSchema,
  targetCpmCents: CentsSchema,
  biddingDeadline: IsoDateTimeSchema,
  requirementChecks: z.array(RequirementCheckSchema),
  relevance: RelevanceSchema,
  feeQuote: FeeQuoteSchema,
  hasBid: z.boolean(),
})
export type CreatorCampaign = z.infer<typeof CreatorCampaignSchema>

export const listMatchedCampaigns = defineEndpoint({
  method: 'GET',
  path: '/api/creator/campaigns/matched',
  response: listOf(MatchedCampaignSchema),
})

export const getCreatorCampaign = defineEndpoint({
  method: 'GET',
  path: '/api/creator/campaigns/:id',
  params: z.object({ id: IdSchema }),
  response: CreatorCampaignSchema,
})
