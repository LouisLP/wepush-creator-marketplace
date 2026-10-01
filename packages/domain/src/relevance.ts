import type { ReachProfile } from './pricing.ts'
import type { CampaignTerms, Cents, Factor } from './types.ts'
import { PLATFORM_BENCHMARKS } from './benchmarks.ts'
import { factor } from './factors.ts'
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

export function relevance(profile: ReachProfile, terms: CampaignTerms): Relevance {
  const { low, high } = PLATFORM_BENCHMARKS[terms.requirements.platform].cpmRangeCents
  const parity = parityFeeCents(estimateImpressions(profile), terms.targetCpmCents)
  const budgetFit = terms.budgetCents / Math.max(1, parity)

  const values: Record<RelevanceFactorKey, number> = {
    payout: clamp((terms.targetCpmCents - low) / (high - low), 0, 1),
    budget_fit: budgetFit < 1 ? 0 : Math.min(budgetFit, BUDGET_FIT_CAP) / BUDGET_FIT_CAP,
  }
  const factors = (Object.keys(RELEVANCE_WEIGHTS) as RelevanceFactorKey[]).map(key => factor(key, values[key], RELEVANCE_WEIGHTS[key]))

  return {
    relevance: Math.round(factors.reduce((sum, f) => sum + f.contribution, 0)),
    parityFeeCents: parity,
    budgetFit,
    factors,
  }
}

export function byRelevance(a: { relevance: number, terms: CampaignTerms }, b: { relevance: number, terms: CampaignTerms }): number {
  return b.relevance - a.relevance
    || a.terms.biddingDeadline.getTime() - b.terms.biddingDeadline.getTime()
    || a.terms.id.localeCompare(b.terms.id)
}
