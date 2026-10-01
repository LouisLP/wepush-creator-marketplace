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

const meetsMinFollowers = (followers: number, { minFollowers }: Requirements) => followers >= minFollowers
const meetsMinEngagement = (engagementRate: number, { minEngagementRate }: Requirements) => minEngagementRate === null || engagementRate >= minEngagementRate

export function meetsAudienceThresholds(stats: AudienceStats, requirements: Requirements): boolean {
  return meetsMinFollowers(stats.followers, requirements) && meetsMinEngagement(stats.engagementRate, requirements)
}

export function checkRequirements(profile: CreatorProfile, requirements: Requirements): RequirementCheck[] {
  const { minFollowers, minEngagementRate } = requirements
  return [
    { requirement: 'platform', passed: profile.platform === requirements.platform, actual: profile.platform, required: requirements.platform },
    { requirement: 'category', passed: requirements.categories.includes(profile.category), actual: profile.category, required: requirements.categories },
    { requirement: 'minFollowers', passed: meetsMinFollowers(profile.followers, requirements), actual: profile.followers, required: minFollowers },
    { requirement: 'minEngagement', passed: meetsMinEngagement(profile.engagementRate, requirements), actual: profile.engagementRate, required: minEngagementRate },
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

/** A Creator may review a Campaign while it's Matched, or for good once they've bid on it. */
export function canReviewCampaign(profile: CreatorProfile, campaign: CampaignState, hasBid: boolean, now: Date): boolean {
  return hasBid || isMatchedCampaign(profile, campaign, now)
}
