import type { Platform } from './enums.ts'
import type { Cents } from './types.ts'

export interface PlatformBenchmark {
  reachRate: number
  baselineEngagementRate: number
  cpmRangeCents: { low: Cents, high: Cents }
}

// Sourced in docs/research/platform-reach-engagement-benchmarks.md
export const PLATFORM_BENCHMARKS: Record<Platform, PlatformBenchmark> = {
  instagram: { reachRate: 0.10, baselineEngagementRate: 0.02, cpmRangeCents: { low: 500 as Cents, high: 2_000 as Cents } },
  tiktok: { reachRate: 0.15, baselineEngagementRate: 0.05, cpmRangeCents: { low: 300 as Cents, high: 1_500 as Cents } },
}
