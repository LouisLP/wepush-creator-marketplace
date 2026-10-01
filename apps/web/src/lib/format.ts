import type { Category, LossReason, Platform } from '@wepush/contracts'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export const formatCents = (cents: number) => usd.format(cents / 100)
export const formatCount = (n: number) => compact.format(n)
export const formatPercent = (fraction: number) => percent.format(fraction)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

export function formatVsTarget(effectiveCpmCents: number, targetCpmCents: number): string {
  const pct = Math.round((effectiveCpmCents / targetCpmCents - 1) * 100)
  return pct === 0 ? 'at target' : pct < 0 ? `${-pct}% under target` : `${pct}% over target`
}

const PLATFORM_LABELS: Record<Platform, string> = { tiktok: 'TikTok', instagram: 'Instagram' }
export const formatPlatform = (platform: Platform) => PLATFORM_LABELS[platform]
export const formatCategory = (category: Category) => category[0]!.toUpperCase() + category.slice(1)

const LOSS_REASON_LABELS: Record<LossReason, string> = {
  requirements_not_met: 'Snapshot didn’t meet the Requirements',
  fee_out_of_range: 'Fee outside the Fee Range',
  over_budget: 'Fee didn’t fit the Remaining Budget',
}
export const formatLossReason = (reason: LossReason) => LOSS_REASON_LABELS[reason]

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatTimeLeft(iso: string, now = new Date()): string {
  const ms = new Date(iso).getTime() - now.getTime()
  if (ms <= 0)
    return 'bidding closed'
  if (ms < HOUR)
    return `${Math.ceil(ms / MINUTE)}m left`
  if (ms < 2 * DAY)
    return `${Math.floor(ms / HOUR)}h left`
  return `${Math.floor(ms / DAY)}d left`
}
