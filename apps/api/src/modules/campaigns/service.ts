import type { AdvertiserId } from '@wepush/domain'
import type { AppDeps } from '../../app.ts'

export function createAdvertiserCampaignService({ repos }: Pick<AppDeps, 'repos'>) {
  return {
    list: (advertiserId: AdvertiserId) => repos.campaigns.listByAdvertiser(advertiserId),
  }
}
