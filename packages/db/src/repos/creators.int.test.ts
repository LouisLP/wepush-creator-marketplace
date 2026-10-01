import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { UniqueViolationError } from '../errors.ts'
import { createTestContext } from '../testing/index.ts'

const ctx = createTestContext()
beforeEach(() => ctx.reset())
afterAll(() => ctx.close())

const profile = { platform: 'instagram', category: 'tech', followers: 9_000, engagementRate: 0.031 } as const

describe('creators repo', () => {
  it('creates and reads back a creator as a domain object', async () => {
    const created = await ctx.repos.creators.create({ handle: '@ada.codes', ...profile })

    expect(await ctx.repos.creators.getById(created.id)).toEqual({
      id: created.id,
      handle: '@ada.codes',
      profile,
      createdAt: expect.any(Date),
    })
  })

  it('translates a duplicate handle into a UniqueViolationError', async () => {
    await ctx.repos.creators.create({ handle: '@dup', ...profile })

    await expect(ctx.repos.creators.create({ handle: '@dup', ...profile }))
      .rejects
      .toMatchObject({ name: 'UniqueViolationError', constraint: 'creators_handle_unique' })
    await expect(ctx.repos.creators.create({ handle: '@dup', ...profile })).rejects.toBeInstanceOf(UniqueViolationError)
  })
})
