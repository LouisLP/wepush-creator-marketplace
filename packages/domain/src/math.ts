export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const round2 = (n: number) => Math.round(n * 100) / 100
