import type { AdvertiserId, CreatorId } from '@wepush/domain'
import type { FastifyRequest, onRequestAsyncHookHandler } from 'fastify'
import type { AppDeps } from '../app.ts'
import { ActorIdHeaderSchema, ADVERTISER_ID_HEADER, CREATOR_ID_HEADER } from '@wepush/contracts'
import { AppError } from '../errors.ts'

export type Actor
  = | { role: 'advertiser', advertiserId: AdvertiserId }
    | { role: 'creator', creatorId: CreatorId }

declare module 'fastify' {
  interface FastifyRequest {
    actor: Actor | null
  }
}

function actorHook(header: string, exists: (id: string) => Promise<boolean>, toActor: (id: string) => Actor): onRequestAsyncHookHandler {
  return async (req) => {
    const parsed = ActorIdHeaderSchema.safeParse(req.headers[header])
    if (!parsed.success)
      throw new AppError('actor_required', `Missing or malformed ${header} header`)
    if (!(await exists(parsed.data)))
      throw new AppError('unknown_actor', `No actor matches ${header}`)
    req.actor = toActor(parsed.data)
  }
}

export function advertiserActor({ repos }: Pick<AppDeps, 'repos'>) {
  return actorHook(
    ADVERTISER_ID_HEADER,
    async id => !!(await repos.advertisers.getById(id)),
    id => ({ role: 'advertiser', advertiserId: id as AdvertiserId }),
  )
}

export function creatorActor({ repos }: Pick<AppDeps, 'repos'>) {
  return actorHook(
    CREATOR_ID_HEADER,
    async id => !!(await repos.creators.getById(id)),
    id => ({ role: 'creator', creatorId: id as CreatorId }),
  )
}

export function advertiserIdOf(req: FastifyRequest): AdvertiserId {
  if (req.actor?.role !== 'advertiser')
    throw new Error('advertiserActor hook not registered for this route')
  return req.actor.advertiserId
}

export function creatorIdOf(req: FastifyRequest): CreatorId {
  if (req.actor?.role !== 'creator')
    throw new Error('creatorActor hook not registered for this route')
  return req.actor.creatorId
}
