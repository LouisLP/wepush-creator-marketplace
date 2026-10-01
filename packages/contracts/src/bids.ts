import { SCORE_WEIGHTS } from '@wepush/domain'
import { z } from 'zod'
import { defineEndpoint } from './endpoint.ts'
import { BidStatusSchema, CentsSchema, EngagementRateSchema, factorSchema, IdSchema, IsoDateTimeSchema, listOf, LossReasonSchema } from './primitives.ts'

export const ScoreFactorSchema = factorSchema(SCORE_WEIGHTS)
export type ScoreFactor = z.infer<typeof ScoreFactorSchema>

export const BidSnapshotSchema = z.object({
  followers: z.int().nonnegative(),
  engagementRate: EngagementRateSchema,
  estimatedImpressions: z.int().positive(),
  effectiveCpmCents: z.int().nonnegative(),
})
export type BidSnapshot = z.infer<typeof BidSnapshotSchema>

export const BidOutcomeSchema = z.object({
  rank: z.int().positive(),
  score: z.number().min(0).max(100),
  factors: z.array(ScoreFactorSchema),
  scoringVersion: z.string(),
  lossReason: LossReasonSchema.nullable(),
  /** Budget left when this Bid's turn came; null for ineligible Bids. */
  remainingBudgetCents: z.int().nonnegative().nullable(),
})
export type BidOutcome = z.infer<typeof BidOutcomeSchema>

/** The acting Creator's own Bid; null `outcome` until Closing. */
export const CreatorBidSchema = z.object({
  id: IdSchema,
  feeCents: CentsSchema,
  status: BidStatusSchema,
  placedAt: IsoDateTimeSchema,
  snapshot: BidSnapshotSchema,
  outcome: BidOutcomeSchema.nullable(),
})
export type CreatorBid = z.infer<typeof CreatorBidSchema>

export const MyBidSchema = z.object({
  id: IdSchema,
  campaignId: IdSchema,
  campaignTitle: z.string(),
  feeCents: CentsSchema,
  status: BidStatusSchema,
  rank: z.int().positive().nullable(),
  biddingDeadline: IsoDateTimeSchema,
})
export type MyBid = z.infer<typeof MyBidSchema>

export const placeBid = defineEndpoint({
  method: 'POST',
  path: '/api/creator/campaigns/:id/bids',
  status: 201,
  params: z.object({ id: IdSchema }),
  body: z.object({ feeCents: CentsSchema }),
  response: CreatorBidSchema,
})

export const listMyBids = defineEndpoint({
  method: 'GET',
  path: '/api/creator/bids',
  response: listOf(MyBidSchema),
})
