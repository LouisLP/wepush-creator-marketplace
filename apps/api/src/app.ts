import type { Repos, UnitOfWork } from '@wepush/db'
import type { Clock } from '@wepush/domain'
import type { FastifyServerOptions } from 'fastify'
import { randomUUID } from 'node:crypto'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { advertiserRoutes } from './modules/advertisers/routes.ts'
import { advertiserCampaignRoutes } from './modules/campaigns/routes.ts'
import { creatorProfileRoutes, creatorRoutes } from './modules/creators/routes.ts'
import { advertiserActor, creatorActor } from './plugins/actor.ts'
import { registerErrorHandling } from './plugins/error-handler.ts'

export interface AppDeps {
  repos: Repos
  uow: UnitOfWork
  clock: Clock
}

export interface AppOptions {
  logger?: FastifyServerOptions['logger']
  docs?: boolean
}

export async function buildApp(deps: AppDeps, opts: AppOptions = {}) {
  const app = Fastify({
    logger: opts.logger ?? false,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.decorateRequest('actor', null)
  app.addHook('onRequest', async (req, reply) => {
    reply.header('x-request-id', req.id)
  })
  registerErrorHandling(app)

  if (opts.docs) {
    await app.register(swagger, {
      openapi: { info: { title: 'WePush API', version: '0.0.0' } },
      transform: jsonSchemaTransform,
    })
    await app.register(swaggerUi, { routePrefix: '/api/docs' })
  }

  await app.register(advertiserRoutes(deps))
  await app.register(creatorRoutes(deps))

  await app.register(async (advertiserScope) => {
    advertiserScope.addHook('onRequest', advertiserActor(deps))
    await advertiserScope.register(advertiserCampaignRoutes(deps))
  })

  await app.register(async (creatorScope) => {
    creatorScope.addHook('onRequest', creatorActor(deps))
    await creatorScope.register(creatorProfileRoutes(deps))
  })

  return app
}
