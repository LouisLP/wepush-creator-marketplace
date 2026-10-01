import type { AppDeps } from '../../app.ts'

export function createAdvertiserService({ repos }: Pick<AppDeps, 'repos'>) {
  return {
    list: () => repos.advertisers.list(),
    create: (input: { name: string }) => repos.advertisers.create(input),
  }
}
