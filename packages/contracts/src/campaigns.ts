import type { RelevanceFactorKey } from '@wepush/domain'
import { CAMPAIGN_LIMITS, RELEVANCE_WEIGHTS } from '@wepush/domain'
import { z } from 'zod'
import { defineEndpoint } from './endpoint.ts'
import { RequirementCheckSchema } from './errors.ts'
import { CampaignStatusSchema, CategorySchema, CentsSchema, EngagementRateSchema, IdSchema, IsoDateTimeSchema, listOf, PlatformSchema } from './primitives.ts'

export { CAMPAIGN_LIMITS, PLATFORM_BENCHMARKS } from '@wepush/domain'

const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`
const { budgetCents, targetCpmCents } = CAMPAIGN_LIMITS

function centsBetween({ min, max }: { min: number, max: number }) {
  return z.int('Enter an amount')
    .min(min, `Must be at least ${dollars(min)}`)
    .max(max, `Must be at most ${dollars(max)}`)
}

export const CampaignPreviewBodySchema = z.strictObject({
  platform: PlatformSchema,
  categories: z.array(CategorySchema)
    .min(1, 'Pick at least one category')
    .refine(cs => new Set(cs).size === cs.length, 'Categories must be unique'),
  minFollowers: z.int().min(0).max(CAMPAIGN_LIMITS.minFollowersMax),
  minEngagementRate: EngagementRateSchema.nullable().default(null),
  budgetCents: centsBetween(budgetCents),
  targetCpmCents: centsBetween(targetCpmCents),
})
export type CampaignPreviewBody = z.input<typeof CampaignPreviewBodySchema>

export const CreateCampaignBodySchema = CampaignPreviewBodySchema.extend({
  title: z.string().trim().min(1, 'Required').max(CAMPAIGN_LIMITS.titleMaxLength),
  brief: z.string().trim().min(1, 'Required').max(CAMPAIGN_LIMITS.briefMaxLength),
  biddingDeadline: IsoDateTimeSchema,
})
export type CreateCampaignBody = z.input<typeof CreateCampaignBodySchema>

export const AdvertiserCampaignSummarySchema = z.object({
  id: IdSchema,
  title: z.string(),
  platform: PlatformSchema,
  status: CampaignStatusSchema,
  budgetCents: CentsSchema,
  biddingDeadline: IsoDateTimeSchema,
  bidCount: z.int().nonnegative(),
  spentCents: z.int().nonnegative().nullable(),
  createdAt: IsoDateTimeSchema,
})
export type AdvertiserCampaignSummary = z.infer<typeof AdvertiserCampaignSummarySchema>

export const CampaignPreviewSchema = z.object({
  matchingCreators: z.int().nonnegative(),
  suggestedFees: z.object({ minCents: CentsSchema, medianCents: CentsSchema, maxCents: CentsSchema }).nullable(),
  postsAtMedian: z.int().nonnegative().nullable(),
  cpmRangeCents: z.object({ low: CentsSchema, high: CentsSchema }),
})
export type CampaignPreview = z.infer<typeof CampaignPreviewSchema>

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

export const createCampaign = defineEndpoint({
  method: 'POST',
  path: '/api/advertiser/campaigns',
  status: 201,
  body: CreateCampaignBodySchema,
  response: AdvertiserCampaignSummarySchema,
})

export const previewCampaign = defineEndpoint({
  method: 'POST',
  path: '/api/advertiser/campaigns/preview',
  body: CampaignPreviewBodySchema,
  response: CampaignPreviewSchema,
})
