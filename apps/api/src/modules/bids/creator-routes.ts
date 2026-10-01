import type { CampaignId, Cents } from '@wepush/domain'
import type { FastifyPluginAsync } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { listMyBids, placeBid } from '@wepush/contracts'
import { route } from '../../http/route.ts'
import { creatorIdOf } from '../../plugins/actor.ts'
import { createCreatorBidService } from './creator-service.ts'
import { toCreatorBid, toMyBid } from './dto.ts'

export function creatorBidRoutes(deps: AppDeps): FastifyPluginAsync {
  return async (app) => {
    const service = createCreatorBidService(deps)

    route(app, placeBid, async req =>
      toCreatorBid(await service.place(creatorIdOf(req), req.params.id as CampaignId, req.body.feeCents as Cents)))

    route(app, listMyBids, async req => ({
      items: (await service.listMine(creatorIdOf(req))).map(toMyBid),
    }))
  }
}
