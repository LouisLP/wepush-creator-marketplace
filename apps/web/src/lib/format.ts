const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export const formatCents = (cents: number) => usd.format(cents / 100)
export const formatCount = (n: number) => compact.format(n)
export const formatPercent = (fraction: number) => percent.format(fraction)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
