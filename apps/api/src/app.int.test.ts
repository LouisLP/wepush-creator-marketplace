import type { FastifyInstance } from 'fastify'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ADVERTISER_ID_HEADER, CREATOR_ID_HEADER } from '@wepush/contracts'
import { createTestContext, insertAdvertiser, insertCampaign, insertCreator } from '@wepush/db/testing'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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

describe('health', () => {
  const buildAppWithDbDown = () => buildApp({ ...ctx, pingDb: () => Promise.reject(new Error('db down')) })

  it('/healthz is up without touching the DB', async () => {
    const down = await buildAppWithDbDown()

    const res = await down.inject({ method: 'GET', url: '/healthz' })
    await down.close()

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('/readyz is ready when the DB answers', async () => {
    const res = await app.inject({ method: 'GET', url: '/readyz' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('/readyz is 503 when the DB is unreachable', async () => {
    const down = await buildAppWithDbDown()

    const res = await down.inject({ method: 'GET', url: '/readyz' })
    await down.close()

    expect(res.statusCode).toBe(503)
    expect(res.json()).toEqual({ status: 'unavailable' })
  })
})

describe('web app serving', () => {
  let webRoot: string
  let web: FastifyInstance

  beforeAll(async () => {
    webRoot = await mkdtemp(join(tmpdir(), 'wepush-web-'))
    await mkdir(join(webRoot, 'assets'))
    await writeFile(join(webRoot, 'index.html'), '<!doctype html><div id="app"></div>')
    await writeFile(join(webRoot, 'assets', 'main-abc123.js'), 'console.log(1)')
  })
  beforeEach(async () => {
    web = await buildApp(ctx, { webRoot })
  })
  afterEach(() => web.close())
  afterAll(() => rm(webRoot, { recursive: true, force: true }))

  it('serves index.html at the root', async () => {
    const res = await web.inject({ method: 'GET', url: '/' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
  })

  it('falls back to index.html for client-side routes', async () => {
    const res = await web.inject({ method: 'GET', url: '/advertiser/campaigns?tab=open' })

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('<div id="app">')
  })

  it('serves hashed assets as immutable', async () => {
    const res = await web.inject({ method: 'GET', url: '/assets/main-abc123.js' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toContain('immutable')
  })

  it('404s missing files and unknown /api routes as problem+json', async () => {
    for (const url of ['/assets/missing.js', '/api/nope']) {
      const res = await web.inject({ method: 'GET', url })

      expect(res.statusCode).toBe(404)
      expect(res.json()).toMatchObject({ code: 'not_found' })
    }
  })

  it('keeps the API working alongside the web app', async () => {
    const res = await web.inject({ method: 'GET', url: '/api/advertisers' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ items: [] })
  })
})

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
