// PROTOTYPE (#52) — throwaway static mock data. Numbers follow the #19/#20/#21/#25 formulas roughly.
export type Platform = 'instagram' | 'tiktok'
export type LossReason = 'requirements_not_met' | 'fee_out_of_range' | 'over_budget'
export type BidStatus = 'pending' | 'won' | 'lost'

export interface Factor { label: string, value: number, weight: number, note: string }

export interface Advertiser { id: string, name: string, openCount: number }
export interface Creator { id: string, handle: string, platform: Platform, category: string, followers: number, engagementRate: number }

export interface AdvBid {
  id: string
  rank: number
  handle: string
  platform: Platform
  category: string
  followers: number
  engagementRate: number
  impressions: number
  feeCents: number
  cpmCents: number
  score: number
  status: 'won' | 'lost'
  lossReason: LossReason | null
  remainingBudgetCents: number | null
  factors: Factor[]
}

export interface AdvCampaign {
  id: string
  title: string
  brief: string
  platform: Platform
  categories: string[]
  minFollowers: number
  minEngagementRate: number | null
  budgetCents: number
  targetCpmCents: number
  deadline: string
  status: 'open' | 'closed'
  closedAt: string | null
  bids: AdvBid[]
}

export interface Check { label: string, need: string, you: string, passed: boolean }

export interface CreatorCampaign {
  id: string
  title: string
  advertiser: string
  brief: string
  platform: Platform
  categories: string[]
  budgetCents: number
  targetCpmCents: number
  deadline: string
  status: 'open' | 'closed'
  relevance: number
  relevanceFactors: Factor[]
  checks: Check[]
  quote: { impressions: number, suggestedCents: number, minCents: number, maxCents: number }
  bid: null | {
    feeCents: number
    cpmCents: number
    placedAt: string
    status: BidStatus
    rank: number | null
    score: number | null
    scoreFactors: Factor[] | null
    lossReason: LossReason | null
    remainingBudgetCents: number | null
  }
}

const HOUR = 3600_000
const inHours = (h: number) => new Date(Date.now() + h * HOUR).toISOString()

export const advertisers: Advertiser[] = [
  { id: 'a1', name: 'Acme Co', openCount: 2 },
  { id: 'a2', name: 'Lumen Kitchenware', openCount: 1 },
  { id: 'a3', name: 'Northwind Grocers', openCount: 1 },
  { id: 'a4', name: 'Brightside Bank', openCount: 0 },
]

export const creators: Creator[] = [
  { id: 'c1', handle: '@mia.cooks', platform: 'instagram', category: 'food', followers: 48_000, engagementRate: 0.031 },
  { id: 'c2', handle: '@kitchenkai', platform: 'instagram', category: 'food', followers: 35_000, engagementRate: 0.045 },
  { id: 'c3', handle: '@liftwithlena', platform: 'tiktok', category: 'fitness', followers: 260_000, engagementRate: 0.062 },
  { id: 'c4', handle: '@pixelpete', platform: 'tiktok', category: 'gaming', followers: 910_000, engagementRate: 0.038 },
  { id: 'c5', handle: '@glowwithjo', platform: 'instagram', category: 'beauty', followers: 132_000, engagementRate: 0.022 },
]

const scoreFactors = (cpmFit: number, eng: number, cpm: string, er: string): Factor[] => [
  { label: 'CPM fit', value: cpmFit, weight: 0.75, note: `Effective CPM ${cpm} vs Target $12.00` },
  { label: 'Engagement', value: eng, weight: 0.25, note: `${er} vs Instagram baseline 2.0%` },
]

export const advCampaigns: AdvCampaign[] = [
  {
    id: 'k1',
    title: 'Spring recipe series',
    brief: 'One Reel cooking a weeknight dish with our new cast-iron skillet. Show the sear, mention the lifetime warranty, link in bio. Keep it under 45 seconds and natural — no scripted read.',
    platform: 'instagram',
    categories: ['food', 'lifestyle'],
    minFollowers: 20_000,
    minEngagementRate: 0.015,
    budgetCents: 50_000,
    targetCpmCents: 1200,
    deadline: inHours(18),
    status: 'open',
    closedAt: null,
    bids: [
      { id: 'b1', rank: 1, handle: '@kitchenkai', platform: 'instagram', category: 'food', followers: 35_000, engagementRate: 0.045, impressions: 7000, feeCents: 6000, cpmCents: 857, score: 77.5, status: 'won', lossReason: null, remainingBudgetCents: 50_000, factors: scoreFactors(0.7, 1, '$8.57', '4.5%') },
      { id: 'b2', rank: 2, handle: '@plantbasedpaz', platform: 'instagram', category: 'food', followers: 120_000, engagementRate: 0.024, impressions: 14_400, feeCents: 14_000, cpmCents: 972, score: 61.3, status: 'won', lossReason: null, remainingBudgetCents: 44_000, factors: scoreFactors(0.617, 0.6, '$9.72', '2.4%') },
      { id: 'b3', rank: 3, handle: '@mia.cooks', platform: 'instagram', category: 'food', followers: 48_000, engagementRate: 0.031, impressions: 7440, feeCents: 9000, cpmCents: 1210, score: 56.6, status: 'won', lossReason: null, remainingBudgetCents: 30_000, factors: scoreFactors(0.496, 0.775, '$12.10', '3.1%') },
      { id: 'b4', rank: 4, handle: '@sundaybrunch', platform: 'instagram', category: 'lifestyle', followers: 210_000, engagementRate: 0.016, impressions: 16_800, feeCents: 26_000, cpmCents: 1548, score: 39.1, status: 'lost', lossReason: 'over_budget', remainingBudgetCents: 21_000, factors: scoreFactors(0.388, 0.4, '$15.48', '1.6%') },
      { id: 'b5', rank: 5, handle: '@bigplates', platform: 'instagram', category: 'food', followers: 400_000, engagementRate: 0.01, impressions: 20_000, feeCents: 90_000, cpmCents: 4500, score: 16.3, status: 'lost', lossReason: 'fee_out_of_range', remainingBudgetCents: null, factors: scoreFactors(0.133, 0.25, '$45.00', '1.0%') },
    ],
  },
  {
    id: 'k2',
    title: 'Protein bar launch',
    brief: 'A TikTok showing our new bar as a post-workout snack. Mention 20g protein and the launch discount code.',
    platform: 'tiktok',
    categories: ['fitness', 'food'],
    minFollowers: 50_000,
    minEngagementRate: null,
    budgetCents: 200_000,
    targetCpmCents: 800,
    deadline: inHours(96),
    status: 'open',
    closedAt: null,
    bids: [
      { id: 'b6', rank: 1, handle: '@liftwithlena', platform: 'tiktok', category: 'fitness', followers: 260_000, engagementRate: 0.062, impressions: 48_360, feeCents: 36_000, cpmCents: 744, score: 81.2, status: 'won', lossReason: null, remainingBudgetCents: 200_000, factors: scoreFactors(0.538, 0.62, '$7.44', '6.2%') },
      { id: 'b7', rank: 2, handle: '@gymratgus', platform: 'tiktok', category: 'fitness', followers: 88_000, engagementRate: 0.041, impressions: 10_824, feeCents: 12_000, cpmCents: 1109, score: 47.0, status: 'won', lossReason: null, remainingBudgetCents: 164_000, factors: scoreFactors(0.361, 0.41, '$11.09', '4.1%') },
    ],
  },
  {
    id: 'k3',
    title: 'Holiday gift guide',
    brief: 'A carousel featuring three Acme gifts under $50. Tag @acme and use #AcmeGifts.',
    platform: 'instagram',
    categories: ['lifestyle', 'fashion', 'food'],
    minFollowers: 10_000,
    minEngagementRate: null,
    budgetCents: 120_000,
    targetCpmCents: 1500,
    deadline: inHours(-240),
    status: 'closed',
    closedAt: inHours(-239),
    bids: [
      { id: 'b8', rank: 1, handle: '@stylebyrae', platform: 'instagram', category: 'fashion', followers: 300_000, engagementRate: 0.021, impressions: 31_500, feeCents: 42_000, cpmCents: 1333, score: 66.1, status: 'won', lossReason: null, remainingBudgetCents: 120_000, factors: scoreFactors(0.563, 0.525, '$13.33', '2.1%') },
      { id: 'b9', rank: 2, handle: '@mia.cooks', platform: 'instagram', category: 'food', followers: 46_000, engagementRate: 0.03, impressions: 6900, feeCents: 12_000, cpmCents: 1739, score: 63.4, status: 'won', lossReason: null, remainingBudgetCents: 78_000, factors: scoreFactors(0.431, 0.75, '$17.39', '3.0%') },
      { id: 'b10', rank: 3, handle: '@cosyhome', platform: 'instagram', category: 'lifestyle', followers: 150_000, engagementRate: 0.019, impressions: 14_250, feeCents: 54_000, cpmCents: 3789, score: 31.5, status: 'won', lossReason: null, remainingBudgetCents: 66_000, factors: scoreFactors(0.198, 0.475, '$37.89', '1.9%') },
      { id: 'b11', rank: 4, handle: '@techtara', platform: 'instagram', category: 'tech', followers: 80_000, engagementRate: 0.02, impressions: 8000, feeCents: 15_000, cpmCents: 1875, score: 45.0, status: 'lost', lossReason: 'requirements_not_met', remainingBudgetCents: null, factors: scoreFactors(0.4, 0.5, '$18.75', '2.0%') },
    ],
  },
]

const relevanceFactors = (payout: number, fit: number, cpm: string, posts: string): Factor[] => [
  { label: 'Payout', value: payout, weight: 0.6, note: `Target CPM ${cpm} in Instagram range $5–$20` },
  { label: 'Budget Fit', value: fit, weight: 0.4, note: `Budget covers ~${posts} Posts at your Parity Fee` },
]

const miaChecks = (cats: string, minF: string, minEr: string | null): Check[] => [
  { label: 'Platform', need: 'Instagram', you: 'Instagram', passed: true },
  { label: 'Category', need: cats, you: 'food', passed: true },
  { label: 'Followers', need: `≥ ${minF}`, you: '48K', passed: true },
  { label: 'Engagement', need: minEr ? `≥ ${minEr}` : 'Any', you: '3.1%', passed: true },
]

export const me = creators[0]!

export const creatorCampaigns: CreatorCampaign[] = [
  {
    id: 'm1',
    title: 'Weeknight dinners',
    advertiser: 'Lumen Kitchenware',
    brief: 'Cook any 20-minute dinner using our non-stick pan. One Reel, show the pan in use, mention free shipping. Link in bio for a week.',
    platform: 'instagram',
    categories: ['food'],
    budgetCents: 80_000,
    targetCpmCents: 1400,
    deadline: inHours(72),
    status: 'open',
    relevance: 72,
    relevanceFactors: relevanceFactors(0.6, 1, '$14.00', '7.7'),
    checks: miaChecks('food', '25K', '2.0%'),
    quote: { impressions: 7440, suggestedCents: 10_400, minCents: 1000, maxCents: 31_200 },
    bid: null,
  },
  {
    id: 'm2',
    title: 'Brunch at home',
    advertiser: 'Northwind Grocers',
    brief: 'Show a weekend brunch made with Northwind ingredients. Mention same-day delivery.',
    platform: 'instagram',
    categories: ['food', 'lifestyle'],
    budgetCents: 30_000,
    targetCpmCents: 1100,
    deadline: inHours(20),
    status: 'open',
    relevance: 58,
    relevanceFactors: relevanceFactors(0.4, 0.85, '$11.00', '3.7'),
    checks: miaChecks('food, lifestyle', '10K', null),
    quote: { impressions: 7440, suggestedCents: 8200, minCents: 1000, maxCents: 24_600 },
    bid: null,
  },
  {
    id: 'm3',
    title: 'Meal-prep Mondays',
    advertiser: 'Acme Co',
    brief: 'A meal-prep video using Acme containers. Three meals, one Reel.',
    platform: 'instagram',
    categories: ['food', 'fitness'],
    budgetCents: 15_000,
    targetCpmCents: 700,
    deadline: inHours(150),
    status: 'open',
    relevance: 41,
    relevanceFactors: relevanceFactors(0.13, 0.83, '$7.00', '2.9'),
    checks: miaChecks('food, fitness', '20K', null),
    quote: { impressions: 7440, suggestedCents: 5200, minCents: 1000, maxCents: 15_000 },
    bid: null,
  },
  {
    id: 'k1',
    title: 'Spring recipe series',
    advertiser: 'Acme Co',
    brief: advCampaigns[0]!.brief,
    platform: 'instagram',
    categories: ['food', 'lifestyle'],
    budgetCents: 50_000,
    targetCpmCents: 1200,
    deadline: inHours(18),
    status: 'open',
    relevance: 64,
    relevanceFactors: relevanceFactors(0.47, 1, '$12.00', '5.6'),
    checks: miaChecks('food, lifestyle', '20K', '1.5%'),
    quote: { impressions: 7440, suggestedCents: 8900, minCents: 1000, maxCents: 26_800 },
    bid: { feeCents: 9000, cpmCents: 1210, placedAt: inHours(-30), status: 'pending', rank: null, score: null, scoreFactors: null, lossReason: null, remainingBudgetCents: null },
  },
  {
    id: 'k3',
    title: 'Holiday gift guide',
    advertiser: 'Acme Co',
    brief: advCampaigns[2]!.brief,
    platform: 'instagram',
    categories: ['lifestyle', 'fashion', 'food'],
    budgetCents: 120_000,
    targetCpmCents: 1500,
    deadline: inHours(-240),
    status: 'closed',
    relevance: 70,
    relevanceFactors: relevanceFactors(0.67, 1, '$15.00', '17'),
    checks: miaChecks('lifestyle, fashion, food', '10K', null),
    quote: { impressions: 6900, suggestedCents: 10_350, minCents: 1000, maxCents: 31_050 },
    bid: { feeCents: 12_000, cpmCents: 1739, placedAt: inHours(-300), status: 'won', rank: 2, score: 63.4, scoreFactors: advCampaigns[2]!.bids[1]!.factors, lossReason: null, remainingBudgetCents: 78_000 },
  },
  {
    id: 'k4',
    title: 'Back-to-school lunches',
    advertiser: 'Northwind Grocers',
    brief: 'Packed-lunch ideas for kids using Northwind snacks. One Reel.',
    platform: 'instagram',
    categories: ['food', 'parenting'],
    budgetCents: 40_000,
    targetCpmCents: 1300,
    deadline: inHours(-400),
    status: 'closed',
    relevance: 66,
    relevanceFactors: relevanceFactors(0.53, 1, '$13.00', '4.1'),
    checks: miaChecks('food, parenting', '15K', null),
    quote: { impressions: 7200, suggestedCents: 9360, minCents: 1000, maxCents: 28_080 },
    bid: { feeCents: 9500, cpmCents: 1319, placedAt: inHours(-450), status: 'lost', rank: 4, score: 52.1, scoreFactors: scoreFactors(0.493, 0.75, '$13.19', '3.0%'), lossReason: 'over_budget', remainingBudgetCents: 7000 },
  },
]

export const matched = creatorCampaigns.filter(c => !c.bid)
export const myBids = creatorCampaigns.filter(c => c.bid)

const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
export const usd = (c: number) => usdFmt.format(c / 100)
export const usdShort = (c: number) => (c % 100 === 0 ? usd0.format(c / 100) : usd(c))
export const count = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
export const pct = (f: number) => `${(f * 100).toFixed(1)}%`
export const platformLabel = (p: Platform) => (p === 'instagram' ? 'Instagram' : 'TikTok')
export const platformIcon = (p: Platform) => (p === 'instagram' ? 'simple-icons:instagram' : 'simple-icons:tiktok')
export const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0)
    return 'Closed'
  const h = Math.floor(ms / HOUR)
  return h >= 48 ? `${Math.floor(h / 24)}d left` : h >= 1 ? `${h}h left` : `${Math.ceil(ms / 60000)}m left`
}

export function deadlineState(c: { status: 'open' | 'closed', deadline: string }) {
  if (c.status === 'closed')
    return { tone: 'neutral', icon: 'lucide:lock', label: 'Closed' } as const
  const ms = new Date(c.deadline).getTime() - Date.now()
  if (ms <= 0)
    return { tone: 'neutral', icon: 'lucide:loader', label: 'Closing…' } as const
  return ms < 24 * HOUR
    ? { tone: 'warning', icon: 'lucide:alarm-clock', label: timeLeft(c.deadline) } as const
    : { tone: 'neutral', icon: 'lucide:clock', label: timeLeft(c.deadline) } as const
}

export function vsTarget(cpm: number, target: number) {
  const d = Math.round(((cpm - target) / target) * 100)
  if (d === 0)
    return { tone: 'success', icon: 'lucide:equal', label: 'on' } as const
  return d < 0
    ? { tone: 'success', icon: 'lucide:arrow-down', label: `${Math.abs(d)}%` } as const
    : { tone: 'warning', icon: 'lucide:arrow-up', label: `${d}%` } as const
}

export const LOSS: Record<LossReason, { icon: string, short: string, long: string }> = {
  requirements_not_met: { icon: 'lucide:list-x', short: 'Requirements', long: 'Snapshot didn’t meet the Requirements' },
  fee_out_of_range: { icon: 'lucide:ruler', short: 'Fee out of range', long: 'Fee outside the Fee Range' },
  over_budget: { icon: 'lucide:wallet', short: 'Over budget', long: 'Fee didn’t fit the Remaining Budget' },
}

export function outcome(c: AdvCampaign) {
  const winners = c.bids.filter(b => b.status === 'won')
  const spent = winners.reduce((s, b) => s + b.feeCents, 0)
  const imps = winners.reduce((s, b) => s + b.impressions, 0)
  return { winners, spent, imps, blendedCpm: imps ? Math.round((spent * 1000) / imps) : null }
}

export function step(c: CreatorCampaign): 'review' | 'bid' | 'track' | 'outcome' {
  if (!c.bid)
    return 'review'
  return c.bid.status === 'pending' ? 'track' : 'outcome'
}
