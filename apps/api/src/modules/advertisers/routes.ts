import type { FastifyPluginAsync } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { createAdvertiser, listAdvertisers } from '@wepush/contracts'
import { route } from '../../http/route.ts'
import { toAdvertiserDto } from './dto.ts'
import { createAdvertiserService } from './service.ts'

export function advertiserRoutes(deps: AppDeps): FastifyPluginAsync {
  return async (app) => {
    const service = createAdvertiserService(deps)

    route(app, listAdvertisers, async () => ({
      items: (await service.list()).map(toAdvertiserDto),
    }))

    route(app, createAdvertiser, async req => toAdvertiserDto(await service.create(req.body)))
  }
}
