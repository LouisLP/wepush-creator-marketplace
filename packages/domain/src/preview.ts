import type { PlatformBenchmark } from './benchmarks.ts'
import type { CampaignTerms, Cents, CreatorProfile } from './types.ts'
import { PLATFORM_BENCHMARKS } from './benchmarks.ts'
import { checkRequirements } from './matching.ts'
import { feeQuote } from './pricing.ts'
import { cents } from './types.ts'

export type ProposedTerms = Pick<CampaignTerms, 'requirements' | 'budgetCents' | 'targetCpmCents'>

export interface FeeSpread {
  minCents: Cents
  medianCents: Cents
  maxCents: Cents
}

export interface CampaignPreview {
  matchingCreators: number
  suggestedFees: FeeSpread | null
  /** Posts the Budget buys if every Winner asked the median Suggested Fee. */
  postsAtMedian: number | null
  cpmRangeCents: PlatformBenchmark['cpmRangeCents']
}

function median(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
}

/** What proposed terms would look like to today's Creators, before it is created. */
export function previewCampaign(profiles: readonly CreatorProfile[], terms: ProposedTerms): CampaignPreview {
  const fees = profiles
    .filter(p => checkRequirements(p, terms.requirements).every(c => c.passed))
    .map(p => feeQuote(p, terms).suggestedFeeCents)
    .sort((a, b) => a - b)

  const cpmRangeCents = PLATFORM_BENCHMARKS[terms.requirements.platform].cpmRangeCents
  if (!fees.length)
    return { matchingCreators: 0, suggestedFees: null, postsAtMedian: null, cpmRangeCents }

  const medianCents = cents(median(fees))
  return {
    matchingCreators: fees.length,
    suggestedFees: { minCents: fees[0]!, medianCents, maxCents: fees.at(-1)! },
    postsAtMedian: Math.floor(terms.budgetCents / medianCents),
    cpmRangeCents,
  }
}
