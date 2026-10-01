import type { Advertiser as AdvertiserDto } from '@wepush/contracts'
import type { Advertiser } from '@wepush/db'

export function toAdvertiserDto(a: Advertiser): AdvertiserDto {
  return {
    id: a.id,
    name: a.name,
    createdAt: a.createdAt.toISOString(),
  }
}
