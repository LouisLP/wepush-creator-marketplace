import type { Factor } from './types.ts'

export function factor<K extends string>(key: K, value: number, weight: number): Factor<K> {
  return { key, value, weight, contribution: 100 * weight * value }
}

/** Factors in `weights` order; `total` is the sum of their contributions (0–100). */
export function weighFactors<K extends string>(weights: Record<K, number>, values: Record<K, number>) {
  const factors = (Object.keys(weights) as K[]).map(key => factor(key, values[key], weights[key]))
  return { factors, total: factors.reduce((sum, f) => sum + f.contribution, 0) }
}
