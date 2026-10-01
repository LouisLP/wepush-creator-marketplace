import { z } from 'zod'
import { CategorySchema, PlatformSchema } from './primitives.ts'

const ProblemBaseSchema = z.object({
  type: z.literal('about:blank'),
  title: z.string(),
  status: z.int(),
  detail: z.string(),
  requestId: z.string(),
})

const problem = <C extends string>(code: C) => ProblemBaseSchema.extend({ code: z.literal(code) })

function check<R extends string, A extends z.ZodType, Q extends z.ZodType>(requirement: R, actual: A, required: Q) {
  return z.object({ requirement: z.literal(requirement), passed: z.boolean(), actual, required })
}

export const RequirementCheckSchema = z.discriminatedUnion('requirement', [
  check('platform', PlatformSchema, PlatformSchema),
  check('category', CategorySchema, z.array(CategorySchema)),
  check('minFollowers', z.number(), z.number()),
  check('minEngagement', z.number(), z.number().nullable()),
])
export type RequirementCheck = z.infer<typeof RequirementCheckSchema>

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
  problem('deadline_out_of_range').extend({ earliest: z.iso.datetime(), latest: z.iso.datetime() }),
  problem('internal_error'),
])

export type Problem = z.infer<typeof ProblemSchema>
export type ErrorCode = Problem['code']
export type ProblemExtras<C extends ErrorCode> = Omit<Extract<Problem, { code: C }>, keyof z.infer<typeof ProblemBaseSchema> | 'code'>
