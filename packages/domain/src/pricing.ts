import type { Platform } from './enums.ts'
import type { CampaignTerms, Cents } from './types.ts'
import { PLATFORM_BENCHMARKS } from './benchmarks.ts'
import { clamp } from './math.ts'
import { cents } from './types.ts'

export const FEE_FLOOR_CENTS = cents(1_000)
export const MAX_TARGET_CPM_MULTIPLE = 3

export interface ImpressionInputs {
  platform: Platform
  followers: number
  engagementRate: number
}

export interface FeeRange {
  minCents: Cents
  maxCents: Cents
}

export interface FeeQuote {
  estimatedImpressions: number
  suggestedFeeCents: Cents
  minFeeCents: Cents
  maxFeeCents: Cents
}

export function estimateImpressions({ platform, followers, engagementRate }: ImpressionInputs): number {
  const { reachRate, baselineEngagementRate } = PLATFORM_BENCHMARKS[platform]
  const engagementLift = clamp(engagementRate / baselineEngagementRate, 0.5, 2)
  return Math.max(1, Math.round(followers * reachRate * engagementLift))
}

export function effectiveCpmCents(feeCents: Cents, estimatedImpressions: number): Cents {
  return cents(Math.round(feeCents * 1000 / estimatedImpressions))
}

export function parityFeeCents(estimatedImpressions: number, targetCpmCents: Cents): Cents {
  return cents(Math.round(estimatedImpressions * targetCpmCents / 1000))
}

function feeRangeFromParity(parity: Cents, budgetCents: Cents): FeeRange {
  const max = Math.min(budgetCents, Math.max(FEE_FLOOR_CENTS, Math.round(MAX_TARGET_CPM_MULTIPLE * parity)))
  return { minCents: FEE_FLOOR_CENTS, maxCents: cents(max) }
}

export function feeRange(estimatedImpressions: number, terms: CampaignTerms): FeeRange {
  return feeRangeFromParity(parityFeeCents(estimatedImpressions, terms.targetCpmCents), terms.budgetCents)
}

export function isWithinFeeRange(feeCents: Cents, { minCents, maxCents }: FeeRange): boolean {
  return feeCents >= minCents && feeCents <= maxCents
}

export function feeQuote(profile: ImpressionInputs, terms: Pick<CampaignTerms, 'targetCpmCents' | 'budgetCents'>): FeeQuote {
  const estimatedImpressions = estimateImpressions(profile)
  const parity = parityFeeCents(estimatedImpressions, terms.targetCpmCents)
  const { minCents, maxCents } = feeRangeFromParity(parity, terms.budgetCents)
  return {
    estimatedImpressions,
    suggestedFeeCents: cents(Math.min(maxCents, Math.max(minCents, parity))),
    minFeeCents: minCents,
    maxFeeCents: maxCents,
  }
}
