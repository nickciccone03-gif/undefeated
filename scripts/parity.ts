/**
 * Scoring-path parity check.
 *
 * scoreGame/simulate (the season the player watches) and enumerateWins (the
 * ARMY # rank and daily ceiling) share one formula in the engine. This guard
 * proves it stays that way: for sampled boards, decode sampled lineups from the
 * enumeration and assert simulate() reports the exact same win count.
 * A mismatch means the shareable numbers lie — fail the build.
 */
import { buildDaily, cellPicks, enumerateWins, simulate } from '../src/game/engine'
import { mulberry32 } from '../src/game/rng'
import { SLOT_ORDER, type Pick } from '../src/game/types'

const DAYS = 10
const SAMPLES_PER_DAY = 400

let checked = 0
let mismatches = 0

for (let d = 0; d < DAYS; d++) {
  const { orders, games } = buildDaily(`parity-2026-${d}`)
  const cells = SLOT_ORDER.map((slot) => {
    const o = orders.find((x) => x.slot === slot)!
    return cellPicks(o.era, slot)
  })
  const sizes = cells.map((c) => c.length)
  const total = sizes.reduce((a, b) => a * b, 1)
  const winCounts = enumerateWins(cells, games)

  const rng = mulberry32(0xbeef ^ d)
  for (let s = 0; s < SAMPLES_PER_DAY; s++) {
    const t = Math.floor(rng() * total)
    let rem = t
    const team: Pick[] = cells.map((c, i) => {
      const j = rem % sizes[i]
      rem = Math.floor(rem / sizes[i])
      return c[j]
    })
    const wins = simulate(team, games, 0).wins
    checked++
    if (wins !== winCounts[t]) {
      mismatches++
      if (mismatches <= 5) {
        console.error(
          `✗ day ${d} lineup ${t}: simulate ${wins} ≠ enumerate ${winCounts[t]} [${team.map((p) => p.id).join(' ')}]`,
        )
      }
    }
  }
}

if (mismatches > 0) {
  console.error(`\nPARITY FAILED: ${mismatches}/${checked} sampled lineups disagree between scoring paths`)
  process.exit(1)
}
console.log(`parity ✓ ${checked} sampled lineups across ${DAYS} boards: simulate === enumerate`)
