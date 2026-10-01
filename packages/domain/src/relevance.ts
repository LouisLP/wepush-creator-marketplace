import type { ImpressionInputs } from './pricing.ts'
import type { CampaignTerms, Cents, Factor } from './types.ts'
import { PLATFORM_BENCHMARKS } from './benchmarks.ts'
import { weighFactors } from './factors.ts'
import { clamp } from './math.ts'
import { estimateImpressions, parityFeeCents } from './pricing.ts'

export const RELEVANCE_WEIGHTS = { payout: 0.6, budget_fit: 0.4 } as const
export const BUDGET_FIT_CAP = 5

export type RelevanceFactorKey = keyof typeof RELEVANCE_WEIGHTS

export interface Relevance {
  relevance: number
  parityFeeCents: Cents
  budgetFit: number
  factors: Factor<RelevanceFactorKey>[]
}

export function relevance(profile: ImpressionInputs, terms: CampaignTerms): Relevance {
  const { low, high } = PLATFORM_BENCHMARKS[terms.requirements.platform].cpmRangeCents
  const parity = parityFeeCents(estimateImpressions(profile), terms.targetCpmCents)
  const budgetFit = terms.budgetCents / Math.max(1, parity)

  const values: Record<RelevanceFactorKey, number> = {
    payout: clamp((terms.targetCpmCents - low) / (high - low), 0, 1),
    budget_fit: budgetFit < 1 ? 0 : Math.min(budgetFit, BUDGET_FIT_CAP) / BUDGET_FIT_CAP,
  }
  const { factors, total } = weighFactors(RELEVANCE_WEIGHTS, values)

  return {
    relevance: Math.round(total),
    parityFeeCents: parity,
    budgetFit,
    factors,
  }
}

export interface RelevantCampaign {
  relevance: number
  terms: CampaignTerms
}

export function byRelevance(a: RelevantCampaign, b: RelevantCampaign): number {
  return b.relevance - a.relevance
    || a.terms.biddingDeadline.getTime() - b.terms.biddingDeadline.getTime()
    || a.terms.id.localeCompare(b.terms.id)
}
