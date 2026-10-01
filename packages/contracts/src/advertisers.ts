import { z } from 'zod'
import { defineEndpoint } from './endpoint.ts'
import { IdSchema, IsoDateTimeSchema, listOf } from './primitives.ts'

export const AdvertiserSchema = z.object({
  id: IdSchema,
  name: z.string(),
  createdAt: IsoDateTimeSchema,
})
export type Advertiser = z.infer<typeof AdvertiserSchema>

export const CreateAdvertiserBodySchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
})
export type CreateAdvertiserBody = z.infer<typeof CreateAdvertiserBodySchema>

export const listAdvertisers = defineEndpoint({
  method: 'GET',
  path: '/api/advertisers',
  response: listOf(AdvertiserSchema),
})

export const createAdvertiser = defineEndpoint({
  method: 'POST',
  path: '/api/advertisers',
  status: 201,
  body: CreateAdvertiserBodySchema,
  response: AdvertiserSchema,
})
