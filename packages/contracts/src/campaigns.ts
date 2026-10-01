import { z } from 'zod'
import { defineEndpoint } from './endpoint.ts'
import { CampaignStatusSchema, CentsSchema, IdSchema, IsoDateTimeSchema, listOf, PlatformSchema } from './primitives.ts'

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
