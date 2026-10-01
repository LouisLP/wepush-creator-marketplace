import type { Creator as CreatorDto } from '@wepush/contracts'
import type { Creator } from '@wepush/db'

export function toCreatorDto(c: Creator): CreatorDto {
  return {
    id: c.id,
    handle: c.handle,
    ...c.profile,
    createdAt: c.createdAt.toISOString(),
  }
}
