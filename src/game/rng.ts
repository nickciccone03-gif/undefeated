/** Deterministic seeded PRNG (mulberry32) + helpers. All simulation randomness flows through this. */

export function hashString(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Approximate standard normal via sum of uniforms (Irwin–Hall). Plenty for game noise. */
export function normal(rng: Rng): number {
  let s = 0
  for (let i = 0; i < 6; i++) s += rng()
  return (s - 3) / 0.7071 / Math.sqrt(2) // variance of sum of 6 uniforms is 0.5 → scale to ~1
}

export function shuffled<T>(arr: readonly T[], rng: Rng): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function pickOne<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Local-date day key, Wordle-style: players share a board per local calendar day. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const EPOCH = new Date(2026, 6, 20) // Draft No. 1 — launch day

export function dayNumber(date = new Date()): number {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((a.getTime() - EPOCH.getTime()) / 86400000)
  return diff + 1
}
