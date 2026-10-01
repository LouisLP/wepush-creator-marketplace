import type { CampaignId } from '@wepush/domain'
import type { FastifyPluginAsync } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { getCreatorCampaign, listMatchedCampaigns } from '@wepush/contracts'
import { route } from '../../http/route.ts'
import { creatorIdOf } from '../../plugins/actor.ts'
import { createCreatorCampaignService } from './creator-service.ts'
import { toCreatorCampaign, toMatchedCampaign } from './dto.ts'

export function creatorCampaignRoutes(deps: AppDeps): FastifyPluginAsync {
  return async (app) => {
    const service = createCreatorCampaignService(deps)

    route(app, listMatchedCampaigns, async req => ({
      items: (await service.listMatched(creatorIdOf(req))).map(toMatchedCampaign),
    }))

    route(app, getCreatorCampaign, async req =>
      toCreatorCampaign(await service.getForReview(creatorIdOf(req), req.params.id as CampaignId)))
  }
}
