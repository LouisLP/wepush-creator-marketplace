import type { CampaignId } from '@wepush/domain'
import type { FastifyPluginAsync } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { createCampaign, getAdvertiserCampaign, listAdvertiserCampaigns, previewCampaign } from '@wepush/contracts'
import { route } from '../../http/route.ts'
import { advertiserIdOf } from '../../plugins/actor.ts'
import { toAdvertiserCampaign, toAdvertiserCampaignSummary, toProposedTerms } from './dto.ts'
import { createAdvertiserCampaignService } from './service.ts'

export function advertiserCampaignRoutes(deps: AppDeps): FastifyPluginAsync {
  return async (app) => {
    const service = createAdvertiserCampaignService(deps)

    route(app, listAdvertiserCampaigns, async req => ({
      items: (await service.list(advertiserIdOf(req))).map(toAdvertiserCampaignSummary),
    }))

    route(app, createCampaign, async (req) => {
      const { title, brief, biddingDeadline } = req.body
      const campaign = await service.create({
        advertiserId: advertiserIdOf(req),
        title,
        brief,
        ...toProposedTerms(req.body),
        biddingDeadline: new Date(biddingDeadline),
      })
      return toAdvertiserCampaignSummary(campaign)
    })

    route(app, previewCampaign, async req => service.preview(toProposedTerms(req.body)))

    route(app, getAdvertiserCampaign, async req =>
      toAdvertiserCampaign(await service.review(advertiserIdOf(req), req.params.id as CampaignId)))
  }
}
