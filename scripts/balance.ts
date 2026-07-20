/**
 * Balance report — Requisition Wheel edition.
 * - Lints the 50-war slate against domain quotas.
 * - Lints every ACTIVE cell for ≥4 real choices.
 * - Enumerates the full lineup space for many daily boards: distribution,
 *   ceilings, perfect counts, combo counts.
 *
 * Coupled to RATINGS.md (stat budgets + band targets): when this report's band
 * moves — roster edits or engine/BAL changes — re-center BAL.difficultyShift,
 * bump the version constants, and update RATINGS.md § Change control.
 */
import { QUOTAS, SLATE } from '../src/game/campaigns'
import {
  ACTIVE_CELLS,
  buildDaily,
  cellPicks,
  enumerateWins,
  SEASON_LENGTH,
} from '../src/game/engine'
import { ERA_LABELS, SLOT_ORDER, type SlotId } from '../src/game/types'

const DAYS = 24
let lintFailed = false

// ---- slate lint ----
console.log(`slate: ${SLATE.length} wars, ${SLATE.filter((k) => k.boss).length} bosses`)
for (const q of QUOTAS) {
  const n = SLATE.filter(q.test).length
  const ok = n >= q.min
  if (!ok) lintFailed = true
  console.log(`  quota ${ok ? '✓' : '✗ FAIL'} ${q.label}: ${n} (min ${q.min})`)
}

// ---- active-cell lint ----
console.log('--- active cells ---')
let cellCount = 0
for (const slot of SLOT_ORDER) {
  const parts: string[] = []
  for (const era of ACTIVE_CELLS[slot as SlotId]) {
    const n = cellPicks(era, slot as SlotId).length
    cellCount++
    if (n < 4) {
      lintFailed = true
      parts.push(`${ERA_LABELS[era]}:${n} ✗`)
    } else {
      parts.push(`${ERA_LABELS[era]}:${n}`)
    }
  }
  console.log(`  ${slot.padEnd(10)} ${parts.join('  ')}`)
}
console.log(`  ${cellCount} active cells`)

const leaders = cellPicks('twenties', 'commander').filter((p) => p.ruleset === 'current-affairs')
console.log(`  2020s commander cell: ${cellPicks('twenties', 'commander').length} picks (${leaders.length} current-affairs)`)
if (leaders.length < 6) {
  lintFailed = true
  console.log('  ✗ FAIL: 2020s commander pack short')
}

// ---- daily-board sampling ----
const medians: number[] = []
const maxes: number[] = []
const perfects: number[] = []
const combosPerDay: number[] = []

for (let d = 0; d < DAYS; d++) {
  const { orders, games } = buildDaily(`2026-09-${String((d % 28) + 1).padStart(2, '0')}#${d}`)
  const eras = orders.map((o) => o.era)
  if (new Set(eras).size !== eras.length) {
    lintFailed = true
    console.log(`  ✗ FAIL day ${d}: repeated eras on board [${eras.join(' ')}]`)
  }
  const cells = SLOT_ORDER.map((slot) => {
    const o = orders.find((x) => x.slot === slot)!
    return cellPicks(o.era, slot)
  })
  const wins = enumerateWins(cells, games).sort((a, b) => a - b)
  const n = wins.length
  combosPerDay.push(n)
  medians.push(wins[Math.floor(n / 2)])
  maxes.push(wins[n - 1])
  perfects.push(wins.filter((w) => w >= SEASON_LENGTH).length)
  if (d < 8) {
    console.log(
      `day ${d}: lineups ${n}  min ${wins[0]}  median ${wins[Math.floor(n / 2)]}  p90 ${wins[Math.floor(n * 0.9)]}  max ${wins[n - 1]}  perfect ${wins.filter((w) => w >= SEASON_LENGTH).length}  [${orders.map((o) => `${o.slot}:${o.era}`).join(' ')}]`,
    )
  }
}

const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
console.log('---')
console.log(
  `avg lineups ${Math.round(avg(combosPerDay)).toLocaleString()}  avg median ${avg(medians).toFixed(1)}  avg max ${avg(maxes).toFixed(1)}`,
)
console.log(
  `ceiling distribution: 50×${maxes.filter((c) => c >= 50).length}  49×${maxes.filter((c) => c === 49).length}  48×${maxes.filter((c) => c === 48).length}  ≤47×${maxes.filter((c) => c <= 47).length}`,
)
console.log(
  `perfect-possible days: ${perfects.filter((p) => p > 0).length}/${DAYS} (avg when possible: ${(avg(perfects.filter((p) => p > 0)) || 0).toFixed(1)})`,
)

if (lintFailed) {
  console.error('\nLINT FAILED')
  process.exit(1)
}
