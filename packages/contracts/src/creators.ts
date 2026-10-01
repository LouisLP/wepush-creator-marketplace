import { z } from 'zod'
import { defineEndpoint } from './endpoint.ts'
import { CategorySchema, EngagementRateSchema, IdSchema, IsoDateTimeSchema, listOf, PlatformSchema } from './primitives.ts'

export const CreatorProfileSchema = z.strictObject({
  platform: PlatformSchema,
  category: CategorySchema,
  followers: z.int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  engagementRate: EngagementRateSchema,
})
export type CreatorProfile = z.infer<typeof CreatorProfileSchema>

export const HandleSchema = z.string().trim().regex(/^@?[\w.]{2,30}$/, 'Use 2–30 letters, digits, dots or underscores')

export const CreateCreatorBodySchema = CreatorProfileSchema.extend({ handle: HandleSchema })
export type CreateCreatorBody = z.infer<typeof CreateCreatorBodySchema>

export const CreatorSchema = z.object({
  id: IdSchema,
  handle: z.string(),
  platform: PlatformSchema,
  category: CategorySchema,
  followers: z.int(),
  engagementRate: EngagementRateSchema,
  createdAt: IsoDateTimeSchema,
})
export type Creator = z.infer<typeof CreatorSchema>

export const listCreators = defineEndpoint({
  method: 'GET',
  path: '/api/creators',
  response: listOf(CreatorSchema),
})

export const createCreator = defineEndpoint({
  method: 'POST',
  path: '/api/creators',
  status: 201,
  body: CreateCreatorBodySchema,
  response: CreatorSchema,
})

export const getCreatorProfile = defineEndpoint({
  method: 'GET',
  path: '/api/creator/profile',
  response: CreatorSchema,
})
