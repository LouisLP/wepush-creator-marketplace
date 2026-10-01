import type { ApiError } from './client.ts'
import { formatCents } from '@/lib/format.ts'

export function feeRangeMessage(minCents: number, maxCents: number) {
  return `Fee must be between ${formatCents(minCents)} and ${formatCents(maxCents)}.`
}

export function messageFor({ problem }: ApiError): string {
  switch (problem.code) {
    case 'network_error': return 'Can’t reach the server. Check your connection and try again.'
    case 'validation_failed': return 'Some fields need fixing.'
    case 'bad_request': return 'That request couldn’t be understood.'
    case 'actor_required':
    case 'unknown_actor': return 'Pick who you’re acting as to continue.'
    case 'not_found': return 'We couldn’t find that.'
    case 'campaign_closed': return 'This campaign is closed.'
    case 'deadline_passed': return 'The bidding deadline has passed.'
    case 'already_bid': return 'You’ve already bid on this campaign.'
    case 'handle_taken': return 'That handle is already taken.'
    case 'requirements_not_met': return 'Your profile doesn’t meet this campaign’s requirements.'
    case 'fee_out_of_range': return feeRangeMessage(problem.minCents, problem.maxCents)
    case 'deadline_in_past': return 'The bidding deadline must be in the future.'
    case 'internal_error': return `Something went wrong on our side (ref ${problem.requestId}).`
  }
}

export function fieldErrors({ problem }: ApiError): Record<string, string> {
  if (problem.code !== 'validation_failed')
    return {}
  return Object.fromEntries(problem.errors.map(e => [e.path, e.message]))
}
