import type { CampaignStatus, Category, Platform } from './enums.ts'
import type { CampaignTerms, CreatorProfile, Requirements } from './types.ts'

export type RequirementCheck
  = | { requirement: 'platform', passed: boolean, actual: Platform, required: Platform }
    | { requirement: 'category', passed: boolean, actual: Category, required: Category[] }
    | { requirement: 'minFollowers', passed: boolean, actual: number, required: number }
    | { requirement: 'minEngagement', passed: boolean, actual: number, required: number | null }

export interface AudienceStats {
  followers: number
  engagementRate: number
}

export function meetsAudienceThresholds(stats: AudienceStats, requirements: Requirements): boolean {
  return stats.followers >= requirements.minFollowers
    && (requirements.minEngagementRate === null || stats.engagementRate >= requirements.minEngagementRate)
}

export function checkRequirements(profile: CreatorProfile, requirements: Requirements): RequirementCheck[] {
  const { minFollowers, minEngagementRate } = requirements
  return [
    { requirement: 'platform', passed: profile.platform === requirements.platform, actual: profile.platform, required: requirements.platform },
    { requirement: 'category', passed: requirements.categories.includes(profile.category), actual: profile.category, required: requirements.categories },
    { requirement: 'minFollowers', passed: profile.followers >= minFollowers, actual: profile.followers, required: minFollowers },
    {
      requirement: 'minEngagement',
      passed: minEngagementRate === null || profile.engagementRate >= minEngagementRate,
      actual: profile.engagementRate,
      required: minEngagementRate,
    },
  ]
}

export interface CampaignState {
  status: CampaignStatus
  terms: CampaignTerms
}

export function isMatchedCampaign(profile: CreatorProfile, { status, terms }: CampaignState, now: Date): boolean {
  return status === 'open'
    && now < terms.biddingDeadline
    && checkRequirements(profile, terms.requirements).every(c => c.passed)
}
