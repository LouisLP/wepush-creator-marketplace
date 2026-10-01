import type { FastifyPluginAsync } from 'fastify'
import type { AppDeps } from '../../app.ts'

export function healthRoutes(deps: AppDeps): FastifyPluginAsync {
  return async (app) => {
    app.get('/healthz', { logLevel: 'warn' }, async () => ({ status: 'ok' }))

    app.get('/readyz', { logLevel: 'warn' }, async (req, reply) => {
      try {
        await deps.pingDb()
        return { status: 'ok' }
      }
      catch (err) {
        req.log.warn({ err }, 'readiness check failed')
        return reply.status(503).send({ status: 'unavailable' })
      }
    })
  }
}
