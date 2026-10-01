import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadConfig } from './config.ts'

const valid = { TZ: 'UTC', DATABASE_URL: 'postgres://u:p@localhost:5432/db' }

describe('loadConfig', () => {
  afterEach(() => vi.restoreAllMocks())

  it('applies defaults and coerces numbers', () => {
    expect(loadConfig({ ...valid, API_PORT: '4000' })).toMatchObject({
      nodeEnv: 'development',
      logLevel: 'info',
      dbPoolMax: 10,
      port: 4000,
    })
  })

  it('reports every issue and exits 1 on invalid env', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit')
    })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => loadConfig({ TZ: 'Europe/Paris', API_PORT: 'nope' })).toThrow('exit')
    expect(exit).toHaveBeenCalledWith(1)
    const output = error.mock.calls[0]![0] as string
    expect(output).toContain('TZ')
    expect(output).toContain('DATABASE_URL')
    expect(output).toContain('API_PORT')
  })
})
