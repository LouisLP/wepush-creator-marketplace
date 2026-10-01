import type { Platform } from '@wepush/contracts'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export const formatCents = (cents: number) => usd.format(cents / 100)
export const formatCount = (n: number) => compact.format(n)
export const formatPercent = (fraction: number) => percent.format(fraction)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

const PLATFORM_LABELS: Record<Platform, string> = { tiktok: 'TikTok', instagram: 'Instagram' }
export const formatPlatform = (platform: Platform) => PLATFORM_LABELS[platform]

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
