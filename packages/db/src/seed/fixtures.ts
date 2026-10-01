import type { Category, CreatorProfile, Platform } from '@wepush/domain'

// Hand-authored demo cast. Times are offsets in ms from `now`; a Bid's Fee is `m` × its Parity Fee.

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export interface AdvertiserFixture {
  key: string
  name: string
}

export interface CreatorFixture extends CreatorProfile {
  handle: string
}

export interface BidFixture {
  creator: string
  m: number
  placedAt: number
}

export interface CampaignFixture {
  key: string
  advertiser: string
  title: string
  brief: string
  platform: Platform
  categories: Category[]
  minFollowers: number
  minEngagementRate: number | null
  budgetCents: number
  targetCpmCents: number
  createdAt: number
  biddingDeadline: number
  bids: BidFixture[]
}

export const CAST_CREATED_AT = -30 * DAY

export const ADVERTISERS: AdvertiserFixture[] = [
  { key: 'glow', name: 'Glow Cosmetics' },
  { key: 'fuel', name: 'Fuel Fitness' },
  { key: 'pixel', name: 'Pixel Forge' },
]

export const CREATORS: CreatorFixture[] = [
  { handle: '@glowbyana', platform: 'tiktok', category: 'beauty', followers: 420_000, engagementRate: 0.052 },
  { handle: '@dewydaily', platform: 'tiktok', category: 'beauty', followers: 140_000, engagementRate: 0.071 },
  { handle: '@tinyglam.tess', platform: 'tiktok', category: 'beauty', followers: 2_100, engagementRate: 0.058 },
  { handle: '@slowmornings.zoe', platform: 'tiktok', category: 'lifestyle', followers: 90_000, engagementRate: 0.045 },
  { handle: '@thriftqueen', platform: 'tiktok', category: 'fashion', followers: 260_000, engagementRate: 0.033 },
  { handle: '@pixelpete', platform: 'tiktok', category: 'gaming', followers: 1_200_000, engagementRate: 0.038 },
  { handle: '@lagfreeluna', platform: 'tiktok', category: 'gaming', followers: 85_000, engagementRate: 0.12 },
  { handle: '@wanderwithwen', platform: 'tiktok', category: 'travel', followers: 47_000, engagementRate: 0.049 },
  { handle: '@liftwithleo', platform: 'instagram', category: 'fitness', followers: 75_000, engagementRate: 0.041 },
  { handle: '@coreandcoffee', platform: 'instagram', category: 'fitness', followers: 650_000, engagementRate: 0.024 },
  { handle: '@runwithraf', platform: 'instagram', category: 'fitness', followers: 30_000, engagementRate: 0.009 },
  { handle: '@plantpowerpri', platform: 'instagram', category: 'food', followers: 220_000, engagementRate: 0.028 },
  { handle: '@mia.cooks', platform: 'instagram', category: 'food', followers: 120_000, engagementRate: 0.024 },
  { handle: '@gadgetgabe', platform: 'instagram', category: 'tech', followers: 240_000, engagementRate: 0.019 },
  { handle: '@centsiblesam', platform: 'instagram', category: 'finance', followers: 33_000, engagementRate: 0.027 },
  { handle: '@momof3maya', platform: 'instagram', category: 'parenting', followers: 67_000, engagementRate: 0.031 },
]

export const CAMPAIGNS: CampaignFixture[] = [
  {
    key: 'glow-summer',
    advertiser: 'glow',
    title: 'Summer glow launch',
    brief: 'Show our new SPF serum in your morning routine.',
    platform: 'tiktok',
    categories: ['beauty', 'lifestyle', 'fashion'],
    minFollowers: 1_000,
    minEngagementRate: null,
    budgetCents: 150_000,
    targetCpmCents: 1_400,
    createdAt: -10 * DAY,
    biddingDeadline: -1 * DAY,
    bids: [
      { creator: '@glowbyana', m: 1.2, placedAt: -7 * DAY },
      { creator: '@dewydaily', m: 0.9, placedAt: -6 * DAY - 4 * HOUR },
      { creator: '@thriftqueen', m: 1.3, placedAt: -5 * DAY },
      { creator: '@slowmornings.zoe', m: 1.6, placedAt: -3 * DAY - 2 * HOUR },
      { creator: '@tinyglam.tess', m: 1.96, placedAt: -2 * DAY },
    ],
  },
  {
    key: 'glow-lipstick',
    advertiser: 'glow',
    title: 'Lip tint drop',
    brief: 'A 15-second swatch of all six shades, natural light, no filter.',
    platform: 'tiktok',
    categories: ['beauty', 'fashion'],
    minFollowers: 20_000,
    minEngagementRate: null,
    budgetCents: 350_000,
    targetCpmCents: 1_000,
    createdAt: -4 * DAY,
    biddingDeadline: 5 * MINUTE,
    bids: [
      { creator: '@dewydaily', m: 1.0, placedAt: -2 * DAY },
      { creator: '@thriftqueen', m: 0.8, placedAt: -1 * DAY },
      { creator: '@glowbyana', m: 1.4, placedAt: -3 * HOUR },
    ],
  },
  {
    key: 'glow-holiday',
    advertiser: 'glow',
    title: 'Holiday gift sets',
    brief: 'Unbox the gift set and style a festive look with it.',
    platform: 'tiktok',
    categories: ['beauty', 'lifestyle'],
    minFollowers: 10_000,
    minEngagementRate: null,
    budgetCents: 800_000,
    targetCpmCents: 1_300,
    createdAt: -1 * DAY,
    biddingDeadline: 5 * DAY,
    bids: [],
  },
  {
    key: 'fuel-protein',
    advertiser: 'fuel',
    title: 'Protein bar taste test',
    brief: 'Try all three flavours after a workout and rank them on camera.',
    platform: 'instagram',
    categories: ['fitness', 'food'],
    minFollowers: 5_000,
    minEngagementRate: null,
    budgetCents: 150_000,
    targetCpmCents: 1_500,
    createdAt: -12 * DAY,
    biddingDeadline: -2 * DAY,
    bids: [
      { creator: '@coreandcoffee', m: 1.2, placedAt: -9 * DAY },
      { creator: '@plantpowerpri', m: 0.8, placedAt: -8 * DAY },
      { creator: '@liftwithleo', m: 1.0, placedAt: -6 * DAY },
      { creator: '@mia.cooks', m: 1.8, placedAt: -4 * DAY },
      { creator: '@runwithraf', m: 0.7, placedAt: -3 * DAY },
    ],
  },
  {
    key: 'fuel-shaker',
    advertiser: 'fuel',
    title: 'Shaker bottle giveaway',
    brief: 'Announce the giveaway in a gym-bag reel; link in bio.',
    platform: 'instagram',
    categories: ['fitness'],
    minFollowers: 10_000,
    minEngagementRate: null,
    budgetCents: 300_000,
    targetCpmCents: 900,
    createdAt: -3 * DAY,
    biddingDeadline: 15 * MINUTE,
    bids: [
      { creator: '@liftwithleo', m: 1.2, placedAt: -1 * DAY },
      { creator: '@coreandcoffee', m: 0.9, placedAt: -5 * HOUR },
    ],
  },
  {
    key: 'fuel-ambassador',
    advertiser: 'fuel',
    title: 'Ambassador programme',
    brief: 'Three posts over a month showing Fuel in your real training plan.',
    platform: 'instagram',
    categories: ['fitness', 'food'],
    minFollowers: 100_000,
    minEngagementRate: 0.025,
    budgetCents: 1_000_000,
    targetCpmCents: 1_800,
    createdAt: -2 * DAY,
    biddingDeadline: 6 * DAY,
    bids: [
      { creator: '@plantpowerpri', m: 1.1, placedAt: -1 * DAY },
    ],
  },
  {
    key: 'pixel-beta',
    advertiser: 'pixel',
    title: 'Closed beta keys',
    brief: 'Stream the first hour of the beta and share your key code.',
    platform: 'tiktok',
    categories: ['gaming', 'tech'],
    minFollowers: 50_000,
    minEngagementRate: null,
    budgetCents: 400_000,
    targetCpmCents: 800,
    createdAt: -9 * DAY,
    biddingDeadline: -1 * DAY - 6 * HOUR,
    bids: [],
  },
  {
    key: 'pixel-launch',
    advertiser: 'pixel',
    title: 'Launch trailer reactions',
    brief: 'React to the launch trailer and tell us which class you will main.',
    platform: 'tiktok',
    categories: ['gaming'],
    minFollowers: 20_000,
    minEngagementRate: null,
    budgetCents: 1_000_000,
    targetCpmCents: 700,
    createdAt: -2 * DAY,
    biddingDeadline: 3 * DAY,
    bids: [
      { creator: '@pixelpete', m: 1.1, placedAt: -1 * DAY },
      { creator: '@lagfreeluna', m: 0.9, placedAt: -6 * HOUR },
    ],
  },
  {
    key: 'pixel-controller',
    advertiser: 'pixel',
    title: 'Controller unboxing',
    brief: 'Unbox the Forge Pro controller and test it on your setup.',
    platform: 'instagram',
    categories: ['tech', 'gaming'],
    minFollowers: 20_000,
    minEngagementRate: null,
    budgetCents: 250_000,
    targetCpmCents: 1_000,
    createdAt: -6 * HOUR,
    biddingDeadline: 7 * DAY,
    bids: [],
  },
]
