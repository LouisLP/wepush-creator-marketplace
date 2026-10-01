import type { ErrorCode, Problem } from '@wepush/contracts'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { STATUS_CODES } from 'node:http'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { AppError, STATUS_BY_CODE } from '../errors.ts'

type NotFoundFallback = (req: FastifyRequest, reply: FastifyReply) => FastifyReply | undefined

function problem(code: ErrorCode, detail: string, requestId: string, status = STATUS_BY_CODE[code], extras: object = {}) {
  return {
    type: 'about:blank',
    title: STATUS_CODES[status] ?? 'Error',
    status,
    detail,
    code,
    requestId,
    ...extras,
  } as Problem
}

function toProblem(error: unknown, requestId: string): Problem {
  if (error instanceof AppError)
    return problem(error.code, error.message, requestId, error.status, error.extras)

  if (hasZodFastifySchemaValidationErrors(error)) {
    const errors = error.validation.map(v => ({
      path: v.instancePath.slice(1).replaceAll('/', '.'),
      message: v.message ?? 'Invalid value',
    }))
    return problem('validation_failed', `Invalid ${error.validationContext ?? 'request'}`, requestId, 400, { errors })
  }

  const statusCode = (error as { statusCode?: unknown }).statusCode
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500)
    return problem('bad_request', (error as Error).message, requestId, statusCode)

  return problem('internal_error', 'Unexpected error', requestId)
}

function send(reply: FastifyReply, body: Problem) {
  return reply.status(body.status).type('application/problem+json').send(body)
}

export function registerErrorHandling(app: FastifyInstance, notFoundFallback?: NotFoundFallback) {
  app.setErrorHandler((error, req: FastifyRequest, reply) => {
    const body = toProblem(error, req.id)
    if (body.status >= 500)
      req.log.error({ err: error }, 'unhandled error')
    else
      req.log.info({ code: body.code, status: body.status }, 'request rejected')
    return send(reply, body)
  })

  app.setNotFoundHandler((req, reply) => {
    const handled = notFoundFallback?.(req, reply)
    if (handled)
      return handled
    req.log.info({ code: 'not_found', status: 404 }, 'request rejected')
    return send(reply, problem('not_found', `Route ${req.method} ${req.url} not found`, req.id))
  })
}
