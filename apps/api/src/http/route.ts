import type { Endpoint, ResponseOf } from '@wepush/contracts'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { z } from 'zod'

type OutputOf<S> = S extends z.ZodType ? z.output<S> : unknown

export type RequestOf<E extends Endpoint> = FastifyRequest<{
  Params: OutputOf<E['params']>
  Querystring: OutputOf<E['query']>
  Body: OutputOf<E['body']>
}>

/** Registers a route from its contract descriptor; Zod validates input and serializes output. */
export function route<E extends Endpoint>(
  app: FastifyInstance,
  endpoint: E,
  handler: (req: RequestOf<E>) => Promise<ResponseOf<E>>,
) {
  const status = endpoint.status ?? 200
  app.route({
    method: endpoint.method,
    url: endpoint.path,
    exposeHeadRoute: false,
    schema: {
      ...(endpoint.params && { params: endpoint.params }),
      ...(endpoint.query && { querystring: endpoint.query }),
      ...(endpoint.body && { body: endpoint.body }),
      response: { [status]: endpoint.response },
    },
    handler: async (req, reply) => {
      reply.status(status)
      return handler(req as RequestOf<E>)
    },
  })
}
