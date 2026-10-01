import { z } from 'zod'

const ProblemBaseSchema = z.object({
  type: z.literal('about:blank'),
  title: z.string(),
  status: z.int(),
  detail: z.string(),
  requestId: z.string(),
})

const problem = <C extends string>(code: C) => ProblemBaseSchema.extend({ code: z.literal(code) })

export const RequirementCheckSchema = z.object({
  requirement: z.enum(['platform', 'category', 'minFollowers', 'minEngagement']),
  passed: z.boolean(),
  actual: z.union([z.string(), z.number(), z.null()]),
  required: z.union([z.string(), z.number(), z.array(z.string()), z.null()]),
})

export const ProblemSchema = z.discriminatedUnion('code', [
  problem('validation_failed').extend({
    errors: z.array(z.object({ path: z.string(), message: z.string() })),
  }),
  problem('bad_request'),
  problem('actor_required'),
  problem('unknown_actor'),
  problem('not_found'),
  problem('campaign_closed'),
  problem('deadline_passed'),
  problem('already_bid'),
  problem('handle_taken'),
  problem('requirements_not_met').extend({ checks: z.array(RequirementCheckSchema) }),
  problem('fee_out_of_range').extend({ minCents: z.int(), maxCents: z.int() }),
  problem('deadline_in_past'),
  problem('internal_error'),
])

export type Problem = z.infer<typeof ProblemSchema>
export type ErrorCode = Problem['code']
export type ProblemExtras<C extends ErrorCode> = Omit<Extract<Problem, { code: C }>, keyof z.infer<typeof ProblemBaseSchema> | 'code'>
