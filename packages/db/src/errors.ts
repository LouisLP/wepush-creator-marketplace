interface PgError { code: string, constraint?: string }

function findPgError(e: unknown): PgError | undefined {
  for (let cur = e; cur instanceof Error; cur = cur.cause) {
    if (typeof (cur as Partial<PgError>).code === 'string')
      return cur as unknown as PgError
  }
}

export class ConstraintViolationError extends Error {
  readonly constraint: string
  constructor(message: string, constraint: string | undefined, cause: unknown) {
    super(message, { cause })
    this.constraint = constraint ?? 'unknown'
  }
}

export class UniqueViolationError extends ConstraintViolationError {
  override name = 'UniqueViolationError'
}
export class ForeignKeyViolationError extends ConstraintViolationError {
  override name = 'ForeignKeyViolationError'
}
export class CheckViolationError extends ConstraintViolationError {
  override name = 'CheckViolationError'
}

function errorClassFor(code: string) {
  switch (code) {
    case '23505': return UniqueViolationError
    case '23503': return ForeignKeyViolationError
    case '23514': return CheckViolationError
  }
}

export function translateDbError(e: unknown): unknown {
  const pgError = findPgError(e)
  const ErrorClass = pgError && errorClassFor(pgError.code)
  return ErrorClass ? new ErrorClass(`violates ${pgError.constraint}`, pgError.constraint, e) : e
}

export async function translatingDbErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  }
  catch (e) {
    throw translateDbError(e)
  }
}
