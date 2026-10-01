import type { BodyOf, Endpoint, ParamsOf, Problem, QueryOf, ResponseOf } from '@wepush/contracts'
import { ADVERTISER_ID_HEADER, CREATOR_ID_HEADER, ProblemSchema } from '@wepush/contracts'

export type Role = 'advertiser' | 'creator'

type ClientProblem = Problem | { code: 'network_error', detail: string }

export class ApiError extends Error {
  override name = 'ApiError'
  readonly problem: ClientProblem
  constructor(problem: ClientProblem) {
    super(problem.detail)
    this.problem = problem
  }
}

export interface CallOptions<E extends Endpoint> {
  params?: ParamsOf<E>
  query?: QueryOf<E>
  body?: BodyOf<E>
  signal?: AbortSignal
}

export interface ApiClientDeps {
  fetch?: typeof fetch
  actorIdFor: (role: Role) => string | undefined
  onActorRejected?: (role: Role) => void
}

const HEADER_BY_ROLE = { advertiser: ADVERTISER_ID_HEADER, creator: CREATOR_ID_HEADER } as const

function roleOf(path: string): Role | undefined {
  return path.startsWith('/api/advertiser/') ? 'advertiser' : path.startsWith('/api/creator/') ? 'creator' : undefined
}

function buildUrl(path: string, params?: unknown, query?: unknown) {
  const filled = path.replace(/:(\w+)/g, (_, key: string) =>
    encodeURIComponent(String((params as Record<string, unknown> | undefined)?.[key])))
  const search = new URLSearchParams(Object.entries((query ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v)])).toString()
  return search ? `${filled}?${search}` : filled
}

async function parseProblem(res: Response): Promise<Problem> {
  const parsed = ProblemSchema.safeParse(await res.json().catch(() => null))
  return parsed.success
    ? parsed.data
    : { type: 'about:blank', title: 'Error', status: res.status, detail: 'Unexpected response', code: 'internal_error', requestId: res.headers.get('x-request-id') ?? '' }
}

export function createApiClient({ fetch, actorIdFor, onActorRejected }: ApiClientDeps) {
  const fetchFn: typeof globalThis.fetch = fetch ?? ((input, init) => globalThis.fetch(input, init))

  return async function call<E extends Endpoint>(endpoint: E, opts: CallOptions<E> = {}): Promise<ResponseOf<E>> {
    const role = roleOf(endpoint.path)
    const headers: Record<string, string> = { accept: 'application/json' }
    if (opts.body !== undefined)
      headers['content-type'] = 'application/json'
    const actorId = role && actorIdFor(role)
    if (role && actorId)
      headers[HEADER_BY_ROLE[role]] = actorId

    let res: Response
    try {
      res = await fetchFn(buildUrl(endpoint.path, opts.params, opts.query), {
        method: endpoint.method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: opts.signal,
      })
    }
    catch {
      throw new ApiError({ code: 'network_error', detail: 'Could not reach the server' })
    }

    if (!res.ok) {
      const problem = await parseProblem(res)
      if (role && (problem.code === 'actor_required' || problem.code === 'unknown_actor'))
        onActorRejected?.(role)
      throw new ApiError(problem)
    }
    return res.json() as Promise<ResponseOf<E>>
  }
}

export type ApiCall = ReturnType<typeof createApiClient>
