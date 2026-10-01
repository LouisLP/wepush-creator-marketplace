import type { Category, LossReason, Platform } from './enums.ts'

declare const brand: unique symbol
export type Brand<T, B extends string> = T & { readonly [brand]: B }

export type Cents = Brand<number, 'Cents'>
export type AdvertiserId = Brand<string, 'AdvertiserId'>
export type CreatorId = Brand<string, 'CreatorId'>
export type CampaignId = Brand<string, 'CampaignId'>
export type BidId = Brand<string, 'BidId'>

export const cents = (n: number) => n as Cents

// Domain functions take `now` as a param; only services hold a Clock.
export interface Clock {
  now: () => Date
}

export interface CreatorProfile {
  platform: Platform
  category: Category
  followers: number
  engagementRate: number
}

export interface Requirements {
  platform: Platform
  categories: Category[]
  minFollowers: number
  minEngagementRate: number | null
}

export interface CampaignTerms {
  id: CampaignId
  requirements: Requirements
  budgetCents: Cents
  targetCpmCents: Cents
  biddingDeadline: Date
}

export interface BidSnapshot {
  followers: number
  engagementRate: number
  estimatedImpressions: number
  effectiveCpmCents: Cents
}

export interface PendingBid {
  id: BidId
  creatorId: CreatorId
  feeCents: Cents
  snapshot: BidSnapshot
  placedAt: Date
}

export interface Factor<K extends string = string> {
  key: K
  value: number
  weight: number
  contribution: number
}

export interface BidOutcome {
  bidId: BidId
  score: number
  rank: number
  status: 'won' | 'lost'
  lossReason: LossReason | null
  /** Budget left when this Bid's turn came; null for ineligible Bids. */
  remainingBudgetCents: Cents | null
  factors: Factor[]
}

export interface ClosingOutcome {
  scoringVersion: string
  spentCents: Cents
  outcomes: BidOutcome[]
}
