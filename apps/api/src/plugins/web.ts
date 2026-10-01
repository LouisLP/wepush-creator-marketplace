import type { FastifyInstance } from 'fastify'
import fastifyStatic from '@fastify/static'

export async function registerWeb(app: FastifyInstance, root: string) {
  await app.register(fastifyStatic, {
    root,
    wildcard: false,
    setHeaders: (res, path) => {
      if (path.includes('/assets/'))
        res.header('cache-control', 'public, max-age=31536000, immutable')
    },
  })
}

/** Client-side routes: GETs outside /api whose last segment isn't a file name. */
export function isSpaRoute(method: string, url: string) {
  const path = url.split('?')[0]!
  return (method === 'GET' || method === 'HEAD')
    && path !== '/api' && !path.startsWith('/api/')
    && !path.slice(path.lastIndexOf('/')).includes('.')
}
