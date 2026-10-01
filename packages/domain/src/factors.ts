import type { Factor } from './types.ts'

export function factor<K extends string>(key: K, value: number, weight: number): Factor<K> {
  return { key, value, weight, contribution: 100 * weight * value }
}
