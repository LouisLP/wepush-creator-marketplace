// PROTOTYPE (#22) — throwaway. In-memory mock marketplace using the decided formulas (#19 #20 #21 #25).
import { reactive } from 'vue'

export type Platform = 'instagram' | 'tiktok'
export type LossReason = 'requirements_not_met' | 'fee_out_of_range' | 'over_budget'

export interface Factor { key: string, label: string, value: number, weight: number, contribution: number, note: string }

export interface Creator { id: string, handle: string, platform: Platform, category: string, followers: number, engagementRate: number }

export interface Campaign {
  id: string
  advertiser: string
  title: string
  brief: string
  platform: Platform
  categories: string[]
  minFollowers: number
  minEngagementRate: number | null
  budgetCents: number
  targetCpmCents: number
  biddingDeadline: string
  createdAt: string
  status: 'open' | 'closed'
  spentCents: number | null
  closedAt: string | null
}

export interface Bid {
  id: string
  campaignId: string
  creatorId: string
  feeCents: number
  placedAt: string
  followers: number
  engagementRate: number
  estimatedImpressions: number
  effectiveCpmCents: number
  status: 'pending' | 'won' | 'lost'
  score: number | null
  rank: number | null
  lossReason: LossReason | null
  remainingBudgetCents: number | null
  factors: Factor[] | null
}

export const REACH_RATE: Record<Platform, number> = { instagram: 0.10, tiktok: 0.15 }
export const BASELINE_ER: Record<Platform, number> = { instagram: 0.02, tiktok: 0.05 }
export const CPM_RANGE: Record<Platform, [number, number]> = { instagram: [500, 2000], tiktok: [300, 1500] }
export const FEE_FLOOR = 1000
export const SCORING_VERSION = 'v1'

const HOUR = 3600_000
const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const usd = (c: number) => usdFmt.format(c / 100)
export const count = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
export const pct = (f: number) => `${(f * 100).toFixed(1)}%`
export const platformLabel = (p: Platform) => (p === 'instagram' ? 'Instagram' : 'TikTok')
export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0)
    return 'deadline passed'
  const h = Math.floor(ms / HOUR)
  return h >= 48 ? `${Math.floor(h / 24)}d left` : h >= 1 ? `${h}h left` : `${Math.ceil(ms / 60000)}m left`
}
export const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function impressions(followers: number, er: number, platform: Platform) {
  return Math.max(1, Math.round(followers * REACH_RATE[platform] * clamp(er / BASELINE_ER[platform], 0.5, 2)))
}
export const effectiveCpm = (fee: number, imps: number) => Math.round(fee * 1000 / imps)
export const parityFee = (imps: number, targetCpm: number) => Math.round(imps * targetCpm / 1000)

export function feeQuote(c: Creator, camp: Campaign) {
  const imps = impressions(c.followers, c.engagementRate, camp.platform)
  const parity = parityFee(imps, camp.targetCpmCents)
  const min = FEE_FLOOR
  const max = Math.min(camp.budgetCents, Math.max(FEE_FLOOR, 3 * parity))
  return { impressions: imps, parity, suggested: clamp(parity, min, max), min, max }
}

export function relevance(c: Creator, camp: Campaign) {
  const [lo, hi] = CPM_RANGE[camp.platform]
  const payout = clamp((camp.targetCpmCents - lo) / (hi - lo), 0, 1)
  const q = feeQuote(c, camp)
  const budgetFit = camp.budgetCents / Math.max(q.parity, 1)
  const fit = budgetFit < 1 ? 0 : Math.min(budgetFit, 5) / 5
  const factors: Factor[] = [
    { key: 'payout', label: 'Payout', value: payout, weight: 0.6, contribution: 0.6 * payout, note: `Target CPM ${usd(camp.targetCpmCents)} in ${platformLabel(camp.platform)} range ${usd(lo)}–${usd(hi)}` },
    { key: 'budget_fit', label: 'Budget Fit', value: fit, weight: 0.4, contribution: 0.4 * fit, note: `Budget covers ~${budgetFit.toFixed(1)} Posts at your Parity Fee (capped at 5)` },
  ]
  return { value: Math.round(100 * (0.6 * payout + 0.4 * fit)), factors, budgetFit }
}

export function meetsRequirements(followers: number, er: number, category: string, platform: Platform, camp: Campaign) {
  const misses: string[] = []
  if (platform !== camp.platform)
    misses.push(`Platform is ${platformLabel(camp.platform)}`)
  if (!camp.categories.includes(category))
    misses.push(`Category not in ${camp.categories.join(', ')}`)
  if (followers < camp.minFollowers)
    misses.push(`Followers ${count(followers)} < ${count(camp.minFollowers)}`)
  if (camp.minEngagementRate != null && er < camp.minEngagementRate)
    misses.push(`Engagement ${pct(er)} < ${pct(camp.minEngagementRate)}`)
  return misses
}

export function scoreBid(bid: Bid, camp: Campaign) {
  const cpmFit = clamp(camp.targetCpmCents / bid.effectiveCpmCents, 0, 2) / 2
  const eng = clamp(bid.engagementRate / BASELINE_ER[camp.platform], 0, 2) / 2
  const factors: Factor[] = [
    { key: 'cpm_fit', label: 'CPM fit', value: cpmFit, weight: 0.75, contribution: 0.75 * cpmFit, note: `Effective CPM ${usd(bid.effectiveCpmCents)} vs Target ${usd(camp.targetCpmCents)}` },
    { key: 'engagement', label: 'Engagement', value: eng, weight: 0.25, contribution: 0.25 * eng, note: `${pct(bid.engagementRate)} vs ${platformLabel(camp.platform)} baseline ${pct(BASELINE_ER[camp.platform])}` },
  ]
  return { score: Math.round(10000 * (0.75 * cpmFit + 0.25 * eng)) / 100, factors }
}

// Same rules as Closing; used for the "if it closed now" preview and for the simulated worker.
export function judge(camp: Campaign, campBids: Bid[]) {
  // eslint-disable-next-line ts/no-use-before-define
  const creatorOf = (id: string) => db.creators.find(c => c.id === id)!
  const rows = campBids.map((b) => {
    const cr = creatorOf(b.creatorId)
    const misses = meetsRequirements(b.followers, b.engagementRate, cr.category, cr.platform, camp)
    const q = feeQuote({ ...cr, followers: b.followers, engagementRate: b.engagementRate }, camp)
    const inRange = b.feeCents >= q.min && b.feeCents <= q.max
    const { score, factors } = scoreBid(b, camp)
    const lossReason: LossReason | null = misses.length ? 'requirements_not_met' : !inRange ? 'fee_out_of_range' : null
    return { bid: b, score, factors, eligible: lossReason === null, lossReason }
  })
  rows.sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || a.bid.feeCents - b.bid.feeCents || a.bid.placedAt.localeCompare(b.bid.placedAt))
  let remaining = camp.budgetCents
  return rows.map((r, i) => {
    const before = remaining
    let status: 'won' | 'lost' = 'lost'
    let lossReason: LossReason | null = r.lossReason
    if (r.eligible) {
      if (r.bid.feeCents <= remaining) {
        status = 'won'
        remaining -= r.bid.feeCents
      }
      else { lossReason = 'over_budget' }
    }
    return { ...r, rank: i + 1, status, lossReason, remainingBefore: before }
  })
}

const at = (h: number) => new Date(Date.now() + h * HOUR).toISOString()

const creators: Creator[] = [
  { id: 'me', handle: '@mia.cooks', platform: 'instagram', category: 'food', followers: 48_000, engagementRate: 0.031 },
  { id: 'c2', handle: '@plantplate', platform: 'instagram', category: 'food', followers: 210_000, engagementRate: 0.018 },
  { id: 'c3', handle: '@weeknight.eats', platform: 'instagram', category: 'food', followers: 22_000, engagementRate: 0.052 },
  { id: 'c4', handle: '@chef.tomas', platform: 'instagram', category: 'food', followers: 640_000, engagementRate: 0.012 },
  { id: 'c5', handle: '@slowliving.sam', platform: 'instagram', category: 'lifestyle', followers: 95_000, engagementRate: 0.024 },
  { id: 'c6', handle: '@bakewithbea', platform: 'instagram', category: 'food', followers: 12_500, engagementRate: 0.064 },
  { id: 'c7', handle: '@fitfuel.jo', platform: 'instagram', category: 'fitness', followers: 150_000, engagementRate: 0.021 },
  { id: 'c8', handle: '@tok.tacos', platform: 'tiktok', category: 'food', followers: 420_000, engagementRate: 0.07 },
  { id: 'c9', handle: '@cozy.kitchen', platform: 'instagram', category: 'food', followers: 31_000, engagementRate: 0.009 },
]

const campaigns: Campaign[] = [
  { id: 'k1', advertiser: 'Greenleaf Foods', title: 'Spring salad kits', brief: 'One Reel showing a 10-minute weeknight dinner using a Greenleaf kit. Natural light, no voice-over required. Tag @greenleaf and use #EatGreener.', platform: 'instagram', categories: ['food', 'lifestyle'], minFollowers: 10_000, minEngagementRate: 0.015, budgetCents: 55_000, targetCpmCents: 1400, biddingDeadline: at(30), createdAt: at(-20), status: 'open', spentCents: null, closedAt: null },
  { id: 'k2', advertiser: 'Kettle & Co', title: 'Cold brew launch', brief: 'Feed post or carousel featuring the new cold brew can in a morning routine. Must mention “zero sugar”.', platform: 'instagram', categories: ['food'], minFollowers: 25_000, minEngagementRate: null, budgetCents: 120_000, targetCpmCents: 800, biddingDeadline: at(4), createdAt: at(-48), status: 'open', spentCents: null, closedAt: null },
  { id: 'k3', advertiser: 'Pantry Club', title: 'Meal-prep Sundays', brief: 'Show a Sunday meal-prep session with Pantry Club containers. Story + link sticker preferred.', platform: 'instagram', categories: ['food', 'fitness'], minFollowers: 5_000, minEngagementRate: 0.02, budgetCents: 1_200_000, targetCpmCents: 1800, biddingDeadline: at(120), createdAt: at(-5), status: 'open', spentCents: null, closedAt: null },
  { id: 'k4', advertiser: 'Greenleaf Foods', title: 'Holiday hampers', brief: 'Unboxing of the Greenleaf holiday hamper.', platform: 'instagram', categories: ['food'], minFollowers: 10_000, minEngagementRate: null, budgetCents: 300_000, targetCpmCents: 1200, biddingDeadline: at(-30), createdAt: at(-200), status: 'open', spentCents: null, closedAt: null },
  { id: 'k5', advertiser: 'Kettle & Co', title: 'Matcha minis', brief: 'Short Reel making an iced matcha with Kettle minis.', platform: 'instagram', categories: ['food', 'lifestyle'], minFollowers: 20_000, minEngagementRate: null, budgetCents: 30_000, targetCpmCents: 900, biddingDeadline: at(-60), createdAt: at(-240), status: 'open', spentCents: null, closedAt: null },
  { id: 'k6', advertiser: 'Greenleaf Foods', title: 'Snack bars — TikTok', brief: 'Duet-friendly snack review.', platform: 'tiktok', categories: ['food'], minFollowers: 50_000, minEngagementRate: null, budgetCents: 500_000, targetCpmCents: 700, biddingDeadline: at(60), createdAt: at(-2), status: 'open', spentCents: null, closedAt: null },
]

let seq = 0
function mkBid(campaignId: string, creatorId: string, mult: number, placedH: number): Bid {
  const cr = creators.find(c => c.id === creatorId)!
  const camp = campaigns.find(c => c.id === campaignId)!
  const q = feeQuote(cr, camp)
  const fee = Math.max(FEE_FLOOR, Math.round(q.parity * mult / 100) * 100)
  return { id: `b${++seq}`, campaignId, creatorId, feeCents: fee, placedAt: at(placedH), followers: cr.followers, engagementRate: cr.engagementRate, estimatedImpressions: q.impressions, effectiveCpmCents: effectiveCpm(fee, q.impressions), status: 'pending', score: null, rank: null, lossReason: null, remainingBudgetCents: null, factors: null }
}

const bids: Bid[] = [
  mkBid('k1', 'c2', 1.1, -18),
  mkBid('k1', 'c3', 0.9, -15),
  mkBid('k1', 'c4', 1.4, -10),
  mkBid('k1', 'c5', 1.0, -8),
  mkBid('k1', 'c6', 2.5, -4),
  mkBid('k1', 'c9', 1.0, -2),
  mkBid('k2', 'me', 1.2, -30),
  mkBid('k2', 'c2', 0.95, -20),
  mkBid('k4', 'me', 1.0, -150),
  mkBid('k4', 'c2', 0.9, -140),
  mkBid('k4', 'c3', 1.1, -120),
  mkBid('k4', 'c4', 1.0, -100),
  mkBid('k4', 'c6', 4.0, -90),
  mkBid('k5', 'me', 1.6, -200),
  mkBid('k5', 'c2', 1.0, -190),
  mkBid('k5', 'c5', 0.8, -180),
]

export const db = reactive({ creators, campaigns, bids, now: Date.now() })

export function closeCampaign(id: string) {
  const camp = db.campaigns.find(c => c.id === id)!
  const judged = judge(camp, db.bids.filter(b => b.campaignId === id))
  for (const j of judged) {
    Object.assign(j.bid, { status: j.status, score: j.score, rank: j.rank, lossReason: j.lossReason, factors: j.factors, remainingBudgetCents: j.remainingBefore })
  }
  camp.status = 'closed'
  camp.closedAt = new Date().toISOString()
  camp.spentCents = judged.filter(j => j.status === 'won').reduce((s, j) => s + j.bid.feeCents, 0)
}

// Pretend the worker already ran on past-due campaigns.
for (const c of db.campaigns.filter(c => new Date(c.biddingDeadline).getTime() < Date.now()))
  closeCampaign(c.id)

export function placeBid(campaignId: string, feeCents: number) {
  const me = db.creators.find(c => c.id === 'me')!
  const camp = db.campaigns.find(c => c.id === campaignId)!
  const imps = impressions(me.followers, me.engagementRate, camp.platform)
  db.bids.push({ id: `b${++seq}`, campaignId, creatorId: 'me', feeCents, placedAt: new Date().toISOString(), followers: me.followers, engagementRate: me.engagementRate, estimatedImpressions: imps, effectiveCpmCents: effectiveCpm(feeCents, imps), status: 'pending', score: null, rank: null, lossReason: null, remainingBudgetCents: null, factors: null })
}

export function createCampaign(input: Omit<Campaign, 'id' | 'advertiser' | 'createdAt' | 'status' | 'spentCents' | 'closedAt'>) {
  const id = `k${db.campaigns.length + 10}`
  db.campaigns.unshift({ ...input, id, advertiser: 'Greenleaf Foods', createdAt: new Date().toISOString(), status: 'open', spentCents: null, closedAt: null })
  return id
}

export const me = () => db.creators.find(c => c.id === 'me')!
export const creatorById = (id: string) => db.creators.find(c => c.id === id)!
export const bidsFor = (campaignId: string) => db.bids.filter(b => b.campaignId === campaignId)
export const myBid = (campaignId: string) => db.bids.find(b => b.campaignId === campaignId && b.creatorId === 'me')
export const myCampaigns = () => db.campaigns.filter(c => c.advertiser === 'Greenleaf Foods')

export function matched() {
  const cr = me()
  return db.campaigns
    .filter(c => c.status === 'open' && new Date(c.biddingDeadline).getTime() > Date.now())
    .filter(c => meetsRequirements(cr.followers, cr.engagementRate, cr.category, cr.platform, c).length === 0)
    .filter(c => !myBid(c.id))
    .map(c => ({ campaign: c, relevance: relevance(cr, c), quote: feeQuote(cr, c) }))
    .sort((a, b) => b.relevance.value - a.relevance.value)
}

export const LOSS_COPY: Record<LossReason, string> = {
  requirements_not_met: 'Your profile at bid time did not meet the Requirements',
  fee_out_of_range: 'Your Fee was outside the Fee Range',
  over_budget: 'Your Fee did not fit the Remaining Budget after better-Ranked Winners',
}
