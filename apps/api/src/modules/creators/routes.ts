import type { FastifyPluginAsync } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { createCreator, getCreatorProfile, listCreators } from '@wepush/contracts'
import { route } from '../../http/route.ts'
import { creatorIdOf } from '../../plugins/actor.ts'
import { toCreatorDto } from './dto.ts'
import { createCreatorService } from './service.ts'

export function creatorRoutes(deps: AppDeps): FastifyPluginAsync {
  return async (app) => {
    const service = createCreatorService(deps)

    route(app, listCreators, async () => ({
      items: (await service.list()).map(toCreatorDto),
    }))

    route(app, createCreator, async req => toCreatorDto(await service.create(req.body)))
  }
}

export function creatorProfileRoutes(deps: AppDeps): FastifyPluginAsync {
  return async (app) => {
    const service = createCreatorService(deps)

    route(app, getCreatorProfile, async req => toCreatorDto(await service.getProfile(creatorIdOf(req))))
  }
}
