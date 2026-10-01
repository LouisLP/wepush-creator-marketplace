import type { FastifyInstance } from 'fastify'
import { ADVERTISER_ID_HEADER, CREATOR_ID_HEADER } from '@wepush/contracts'
import { createTestContext, insertAdvertiser, insertCampaign, insertCreator } from '@wepush/db/testing'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from './app.ts'
import { AppError } from './errors.ts'

const ctx = createTestContext()
let app: FastifyInstance

beforeEach(async () => {
  await ctx.reset()
  app = await buildApp(ctx)
})
afterEach(() => app.close())
afterAll(() => ctx.close())

describe('public identity routes', () => {
  it('round-trips advertisers from the DB to the contract DTO', async () => {
    const row = await insertAdvertiser(ctx.db, { name: 'Glow Cosmetics' })

    const res = await app.inject({ method: 'GET', url: '/api/advertisers' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      items: [{ id: row.id, name: 'Glow Cosmetics', createdAt: row.createdAt.toISOString() }],
    })
  })

  it('creates a creator with a normalized handle', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/creators',
      payload: { handle: 'Mia.Cooks', platform: 'tiktok', category: 'food', followers: 1200, engagementRate: 0.07 },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ handle: '@mia.cooks', followers: 1200 })
  })
})

describe('actor resolution', () => {
  it('scopes advertiser routes to the acting advertiser', async () => {
    const mine = await insertCampaign(ctx.db, { title: 'Mine' })
    await insertCampaign(ctx.db, { title: 'Not mine' })

    const res = await app.inject({
      method: 'GET',
      url: '/api/advertiser/campaigns',
      headers: { [ADVERTISER_ID_HEADER]: mine.advertiserId },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().items.map((c: { title: string }) => c.title)).toEqual(['Mine'])
  })

  it('resolves the creator actor', async () => {
    const creator = await insertCreator(ctx.db, { handle: '@leo' })

    const res = await app.inject({ method: 'GET', url: '/api/creator/profile', headers: { [CREATOR_ID_HEADER]: creator.id } })

    expect(res.json()).toMatchObject({ id: creator.id, handle: '@leo' })
  })

  it('rejects a missing header with actor_required', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/creator/profile' })

    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ code: 'actor_required' })
  })

  it('rejects an unknown id with unknown_actor', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/advertiser/campaigns',
      headers: { [ADVERTISER_ID_HEADER]: '01900000-0000-7000-8000-000000000999' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ code: 'unknown_actor' })
  })
})

describe('problem+json errors', () => {
  it('400 validation_failed with field paths', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/advertisers', payload: { name: '', extra: 1 } })

    expect(res.statusCode).toBe(400)
    expect(res.headers['content-type']).toContain('application/problem+json')
    expect(res.json()).toMatchObject({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      code: 'validation_failed',
      requestId: res.headers['x-request-id'],
      errors: expect.arrayContaining([expect.objectContaining({ path: 'name' })]),
    })
  })

  it('400 bad_request on malformed JSON', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/advertisers', headers: { 'content-type': 'application/json' }, payload: '{' })

    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ code: 'bad_request' })
  })

  it('404 not_found on unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nope' })

    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ code: 'not_found' })
  })

  it('409 handle_taken from the unique-constraint backstop', async () => {
    await insertCreator(ctx.db, { handle: '@taken' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/creators',
      payload: { handle: '@taken', platform: 'tiktok', category: 'food', followers: 1, engagementRate: 0.1 },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ code: 'handle_taken' })
  })

  it('422 carries per-code extras', async () => {
    app.get('/api/test/fee', async () => {
      throw new AppError('fee_out_of_range', 'Fee too high', { minCents: 100, maxCents: 500 })
    })

    const res = await app.inject({ method: 'GET', url: '/api/test/fee' })

    expect(res.statusCode).toBe(422)
    expect(res.json()).toMatchObject({ code: 'fee_out_of_range', minCents: 100, maxCents: 500 })
  })

  it('500 internal_error never leaks the message', async () => {
    app.get('/api/test/boom', async () => {
      throw new Error('secret db password in stack')
    })

    const res = await app.inject({ method: 'GET', url: '/api/test/boom', headers: { 'x-request-id': 'req-123' } })

    expect(res.statusCode).toBe(500)
    expect(res.headers['x-request-id']).toBe('req-123')
    expect(res.json()).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Unexpected error',
      code: 'internal_error',
      requestId: 'req-123',
    })
  })
})
