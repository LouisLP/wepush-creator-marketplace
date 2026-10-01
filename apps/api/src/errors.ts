import type { ErrorCode, ProblemExtras } from '@wepush/contracts'

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  validation_failed: 400,
  bad_request: 400,
  actor_required: 401,
  unknown_actor: 401,
  not_found: 404,
  campaign_closed: 409,
  deadline_passed: 409,
  already_bid: 409,
  handle_taken: 409,
  requirements_not_met: 422,
  fee_out_of_range: 422,
  deadline_in_past: 422,
  internal_error: 500,
}

type ExtrasArg<C extends ErrorCode> = object extends ProblemExtras<C>
  ? [extras?: ProblemExtras<C>]
  : [extras: ProblemExtras<C>]

export class AppError<C extends ErrorCode = ErrorCode> extends Error {
  override name = 'AppError'
  readonly code: C
  readonly status: number
  readonly extras: ProblemExtras<C> | undefined

  constructor(code: C, detail: string, ...[extras]: ExtrasArg<C>) {
    super(detail)
    this.code = code
    this.status = STATUS_BY_CODE[code]
    this.extras = extras
  }
}
