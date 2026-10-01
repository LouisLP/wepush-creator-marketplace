import type { CreatorId, CreatorProfile } from '@wepush/domain'
import type { AppDeps } from '../../app.ts'
import { UniqueViolationError } from '@wepush/db'
import { AppError } from '../../errors.ts'

const normalizeHandle = (handle: string) => (handle.startsWith('@') ? handle : `@${handle}`).toLowerCase()

export function createCreatorService({ repos }: Pick<AppDeps, 'repos'>) {
  return {
    list: () => repos.creators.list(),

    async create(input: { handle: string } & CreatorProfile) {
      const handle = normalizeHandle(input.handle)
      try {
        return await repos.creators.create({ ...input, handle })
      }
      catch (e) {
        if (e instanceof UniqueViolationError && e.constraint === 'creators_handle_unique')
          throw new AppError('handle_taken', `${handle} is already taken`)
        throw e
      }
    },

    async getProfile(id: CreatorId) {
      const creator = await repos.creators.getById(id)
      if (!creator)
        throw new AppError('not_found', 'Creator not found')
      return creator
    },
  }
}
