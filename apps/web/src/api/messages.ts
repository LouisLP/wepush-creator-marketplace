import { formatCents, formatDateTime } from '@/lib/format.ts'
import { ApiError } from './client.ts'

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
    case 'deadline_out_of_range': return `Pick a deadline between ${formatDateTime(problem.earliest)} and ${formatDateTime(problem.latest)}.`
    case 'internal_error': return `Something went wrong on our side (ref ${problem.requestId}).`
  }
}

// Rule violations that belong to a single body field, shown on that field.
const FIELD_BY_CODE: Partial<Record<ApiError['problem']['code'], string>> = {
  deadline_in_past: 'biddingDeadline',
  deadline_out_of_range: 'biddingDeadline',
}

export function fieldErrors(e: ApiError): Record<string, string> {
  const { problem } = e
  if (problem.code === 'validation_failed')
    return Object.fromEntries(problem.errors.map(err => [err.path, err.message]))
  const field = FIELD_BY_CODE[problem.code]
  return field ? { [field]: messageFor(e) } : {}
}

/** Form-level message, or undefined when the error is already shown on a field. */
export function formErrorFor(e: ApiError): string | undefined {
  return FIELD_BY_CODE[e.problem.code] ? undefined : messageFor(e)
}

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? messageFor(e) : 'Something went wrong.'
}
