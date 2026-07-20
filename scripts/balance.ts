/**
 * Balance report for the 50-war slate.
 * - Lints the slate against the domain quotas (fails loudly).
 * - Win distribution across ALL 6,561 possible teams for many day seeds.
 * - Daily ceiling distribution (no reroll guarantee — ceilings vary by design).
 * - Per-war degeneracy check: wars everyone wins (>97%) or nobody wins (<3%).
 */
import { QUOTAS, SLATE } from '../src/game/campaigns'
import { BAL, buildDraft, buildSeason, daySeedFrom, SEASON_LENGTH } from '../src/game/engine'
import { STAT_KEYS, SLOT_ORDER, type Pick, type Stats } from '../src/game/types'

const DAYS = 30

// ---- slate lint ----
let lintFailed = false
console.log(`slate: ${SLATE.length} wars, ${SLATE.filter((k) => k.boss).length} bosses`)
for (const q of QUOTAS) {
  const n = SLATE.filter(q.test).length
  const ok = n >= q.min
  if (!ok) lintFailed = true
  console.log(`  quota ${ok ? '✓' : '✗ FAIL'} ${q.label}: ${n} (min ${q.min})`)
}
const ids = new Set(SLATE.map((k) => k.id))
if (ids.size !== SLATE.length) {
  lintFailed = true
  console.log('  ✗ FAIL duplicate war ids')
}

// ---- day analysis (lean re-implementation of the rankTeams inner loop) ----
function normalizedWeights(weights: Partial<Stats>): Stats {
  const w = {} as Stats
  let sum = 0
  for (const k of STAT_KEYS) sum += weights[k] ?? 0
  for (const k of STAT_KEYS) w[k] = (weights[k] ?? 0) / (sum || 1)
  return w
}

interface DayStats {
  min: number
  median: number
  p90: number
  max: number
  perfect: number
  perGameWinRate: number[]
}

function analyzeDay(daySeed: number): DayStats {
  const board = buildDraft(daySeed)
  const games = buildSeason(daySeed)
  const slots = SLOT_ORDER.map((s) => board.options[s])
  const flat: Pick[] = slots.flat()
  const idx = new Map(flat.map((p, i) => [p.id, i]))

  const weights = games.map((g) => normalizedWeights(g.kind.weights))
  const weightedByGame: Float64Array[] = []
  const extrasByGame: Float64Array[] = []
  for (let gi = 0; gi < games.length; gi++) {
    const wRow = new Float64Array(flat.length)
    const eRow = new Float64Array(flat.length)
    for (let pi = 0; pi < flat.length; pi++) {
      const p = flat[pi]
      let s = 0
      for (const k of STAT_KEYS) s += weights[gi][k] * p.stats[k]
      wRow[pi] = s
      let extra = 0
      for (const tag of games[gi].kind.tags) extra += (p.terrain?.[tag] ?? 0) * BAL.terrainScale
      const sp = p.special
      if (
        sp &&
        (sp.trigger === 'any' ||
          sp.trigger === games[gi].kind.id ||
          games[gi].kind.tags.includes(sp.trigger as never) ||
          games[gi].kind.tests.includes(sp.trigger))
      ) {
        extra += sp.bonus * BAL.specialScale
      }
      eRow[pi] = extra
    }
    weightedByGame.push(wRow)
    extrasByGame.push(eRow)
  }
  const thresholds = games.map((g) => g.difficulty + g.noise)
  const taxBase = games.map((_, gi) => BAL.taxK * (0.55 + weights[gi].log * 2.2))

  const winCounts: number[] = []
  const perGameWins = new Array<number>(games.length).fill(0)
  const teamIdx = new Array<number>(8)
  const total = Math.pow(3, 8)

  for (let t = 0; t < total; t++) {
    let rem = t
    let minYear = Infinity
    let maxYear = -Infinity
    for (let s = 0; s < 8; s++) {
      const p = slots[s][rem % 3]
      rem = Math.floor(rem / 3)
      teamIdx[s] = idx.get(p.id)!
      if (p.year < minYear) minYear = p.year
      if (p.year > maxYear) maxYear = p.year
    }
    // teamIdx[0] indexes into flat[], where commander options come first.
    const cmdPick = flat[teamIdx[0]]
    const cmdMult = BAL.cmdBase + (cmdPick.leadership ?? 5) * BAL.cmdPerLeadership
    const adaptFactor = 1.05 - (cmdPick.adaptability ?? 5) * 0.055
    const spreadTerm = Math.sqrt(Math.max(0, (maxYear - minYear) / 100)) * adaptFactor

    let wins = 0
    for (let gi = 0; gi < games.length; gi++) {
      const wRow = weightedByGame[gi]
      const eRow = extrasByGame[gi]
      let wSum = 0
      let eSum = 0
      for (let s = 0; s < 8; s++) {
        wSum += wRow[teamIdx[s]]
        eSum += eRow[teamIdx[s]]
      }
      const score = (wSum / 8) * cmdMult + eSum - taxBase[gi] * spreadTerm
      if (score > thresholds[gi]) {
        wins++
        perGameWins[gi]++
      }
    }
    winCounts.push(wins)
  }

  winCounts.sort((a, b) => a - b)
  const n = winCounts.length
  return {
    min: winCounts[0],
    median: winCounts[Math.floor(n / 2)],
    p90: winCounts[Math.floor(n * 0.9)],
    max: winCounts[n - 1],
    perfect: winCounts.filter((w) => w >= SEASON_LENGTH).length,
    perGameWinRate: perGameWins.map((w) => w / n),
  }
}

const days: DayStats[] = []
for (let d = 0; d < DAYS; d++) {
  const stats = analyzeDay(daySeedFrom(`2026-08-${String((d % 28) + 1).padStart(2, '0')}#${d}`))
  days.push(stats)
  if (d < 8) {
    console.log(
      `day ${d}: min ${stats.min}  median ${stats.median}  p90 ${stats.p90}  max ${stats.max}  perfect ${stats.perfect}`,
    )
  }
}

const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
console.log('---')
console.log(
  `avg min ${avg(days.map((d) => d.min)).toFixed(1)}  avg median ${avg(days.map((d) => d.median)).toFixed(1)}  avg p90 ${avg(days.map((d) => d.p90)).toFixed(1)}  avg max ${avg(days.map((d) => d.max)).toFixed(1)}`,
)
const ceilings = days.map((d) => d.max)
console.log(
  `ceiling distribution: 50×${ceilings.filter((c) => c >= 50).length}  49×${ceilings.filter((c) => c === 49).length}  48×${ceilings.filter((c) => c === 48).length}  ≤47×${ceilings.filter((c) => c <= 47).length}`,
)
console.log(
  `perfect-possible days: ${days.filter((d) => d.perfect > 0).length}/${DAYS}  (avg perfects when possible: ${(
    avg(days.filter((d) => d.perfect > 0).map((d) => d.perfect)) || 0
  ).toFixed(1)})`,
)

// Per-war degeneracy across days.
console.log('--- per-war win rates (avg across days) ---')
const perWar = SLATE.map((k, gi) => ({
  id: k.id,
  boss: !!k.boss,
  rate: avg(days.map((d) => d.perGameWinRate[gi])),
}))
for (const w of perWar) {
  const flag = w.rate > 0.97 ? '  ← FREE WIN' : w.rate < 0.03 ? '  ← WALL' : ''
  if (flag || w.boss) {
    console.log(`  ${w.id}${w.boss ? ' [BOSS]' : ''}: ${(w.rate * 100).toFixed(1)}%${flag}`)
  }
}
console.log(`hardest: ${[...perWar].sort((a, b) => a.rate - b.rate).slice(0, 5).map((w) => `${w.id} ${(w.rate * 100).toFixed(0)}%`).join(', ')}`)
console.log(`easiest: ${[...perWar].sort((a, b) => b.rate - a.rate).slice(0, 5).map((w) => `${w.id} ${(w.rate * 100).toFixed(0)}%`).join(', ')}`)

if (lintFailed) {
  console.error('\nSLATE LINT FAILED')
  process.exit(1)
}
