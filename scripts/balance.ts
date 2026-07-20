/** Balance report: distribution of season records across ALL possible teams for many days. */
import { buildDraft, buildSeason, daySeedFrom, rankTeams, simulate, SEASON_LENGTH } from '../src/game/engine'
import { SLOT_ORDER } from '../src/game/types'

const DAYS = 30

function allWinCounts(daySeed: number): number[] {
  const board = buildDraft(daySeed)
  const games = buildSeason(daySeed)
  const slots = SLOT_ORDER.map((s) => board.options[s])
  const counts: number[] = []
  const total = Math.pow(3, 8)
  for (let t = 0; t < total; t++) {
    let rem = t
    const team = []
    for (let s = 0; s < 8; s++) {
      team.push(slots[s][rem % 3])
      rem = Math.floor(rem / 3)
    }
    counts.push(simulate(team, games, daySeed).wins)
  }
  return counts
}

const medians: number[] = []
const maxes: number[] = []
const mins: number[] = []
const perfects: number[] = []
const p90s: number[] = []

for (let d = 0; d < DAYS; d++) {
  const daySeed = daySeedFrom(`2026-08-${String((d % 28) + 1).padStart(2, '0')}#${d}`)
  const counts = allWinCounts(daySeed).sort((a, b) => a - b)
  const n = counts.length
  const median = counts[Math.floor(n / 2)]
  const p90 = counts[Math.floor(n * 0.9)]
  const max = counts[n - 1]
  const min = counts[0]
  const perfect = counts.filter((c) => c >= SEASON_LENGTH).length
  medians.push(median)
  maxes.push(max)
  mins.push(min)
  perfects.push(perfect)
  p90s.push(p90)
  if (d < 8) {
    console.log(
      `day ${d}: min ${min}  median ${median}  p90 ${p90}  max ${max}  perfect ${perfect}`,
    )
  }
}

const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)
console.log('---')
console.log(`avg min ${avg(mins)}  avg median ${avg(medians)}  avg p90 ${avg(p90s)}  avg max ${avg(maxes)}`)
console.log(`days with a possible perfect season: ${perfects.filter((p) => p > 0).length}/${DAYS}`)
console.log(`avg # of perfect teams on perfect-possible days: ${avg(perfects.filter((p) => p > 0).length ? perfects.filter((p) => p > 0) : [0])}`)

// Sanity: rankTeams agrees with brute force on one day.
const seed = daySeedFrom('sanity-day')
const board = buildDraft(seed)
const games = buildSeason(seed)
const team = SLOT_ORDER.map((s) => board.options[s][0])
const res = simulate(team, games, seed)
const rank = rankTeams(board, games, res.wins)
console.log(`sanity: team wins ${res.wins}, rank ${rank.rank}/${rank.totalTeams}, best ${rank.bestWins} (x${rank.bestCount}), perfect ${rank.perfectCount}`)
