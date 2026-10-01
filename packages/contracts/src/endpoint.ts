import type { z } from 'zod'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface Endpoint {
  method: HttpMethod
  path: `/api/${string}`
  status?: 200 | 201
  params?: z.ZodType
  query?: z.ZodType
  body?: z.ZodType
  response: z.ZodType
}

export function defineEndpoint<const E extends Endpoint>(endpoint: E): E {
  return endpoint
}

type InputOf<S> = S extends z.ZodType ? z.input<S> : undefined

export type ParamsOf<E extends Endpoint> = InputOf<E['params']>
export type QueryOf<E extends Endpoint> = InputOf<E['query']>
export type BodyOf<E extends Endpoint> = InputOf<E['body']>
export type ResponseOf<E extends Endpoint> = z.output<E['response']>
