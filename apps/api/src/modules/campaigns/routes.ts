import type { FastifyPluginAsync } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { listAdvertiserCampaigns } from '@wepush/contracts'
import { route } from '../../http/route.ts'
import { advertiserIdOf } from '../../plugins/actor.ts'
import { toAdvertiserCampaignSummary } from './dto.ts'
import { createAdvertiserCampaignService } from './service.ts'

export function advertiserCampaignRoutes(deps: AppDeps): FastifyPluginAsync {
  return async (app) => {
    const service = createAdvertiserCampaignService(deps)

    route(app, listAdvertiserCampaigns, async req => ({
      items: (await service.list(advertiserIdOf(req))).map(toAdvertiserCampaignSummary),
    }))
  }
}
