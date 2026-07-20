/**
 * Deterministic war engine — v2 (The Requisition Wheel).
 *
 * Daily boards: 8 requisition orders (ERA × SLOT) derived from the local date.
 * The player drafts freely within each cell. Everyone gets the same orders,
 * the same alternate eras (Era Override), and the same 50-war schedule with the
 * same weather — records are globally comparable.
 *
 * Ceilings vary by design: the board is never rerolled toward perfection.
 * "Command HQ" (the ceiling) plays the orders exactly as dealt — no Override,
 * no Transfer — so beating it with your resources is legitimate bragging.
 *
 * Compatibility model (v1, replaces the blanket era tax):
 *  - SUSTAINMENT: your Logistics pick's tech vs. your hungriest unit, scaled by
 *    the scenario's logistics weight. Air/naval wars raise the demand of your
 *    air/naval picks by one (basing, folded in — see SCOPE.md).
 *  - COMMAND & CONTROL: era spread creates the problem; commander adaptability
 *    and your Intelligence pick's INT determine how much of it you actually pay.
 */
import { SLATE } from './campaigns'
import { ALL_PICKS } from './roster'
import { hashString, mulberry32, normal, shuffled } from './rng'
import {
  ERA_LABELS,
  eraOf,
  SLOT_ORDER,
  STAT_KEYS,
  type EraId,
  type Game,
  type GameResult,
  type Pick,
  type RankInfo,
  type Requisition,
  type SeasonResult,
  type SlotId,
  type Stats,
} from './types'

export const SEASON_LENGTH = SLATE.length // 50

export const ROSTER_VERSION = 2
export const RULESET_VERSION = 2
export const SCENARIO_VERSION = 1

/** Balance constants — tuned via scripts/balance.ts. */
export const BAL = {
  noiseSigma: 0.9,
  terrainScale: 0.16,
  specialScale: 0.7,
  cmdBase: 0.85,
  cmdPerLeadership: 0.035,
  difficultyJitter: 0.3,
  difficultyShift: -0.22,
  // Compatibility model.
  sustainBase: 0.16,
  sustainLogWeight: 0.9,
  c2Scale: 0.32,
  c2MitigationMax: 0.75,
}

/**
 * Phase 1a active cells: only these (era × slot) requisitions can be dealt.
 * Every active cell has ≥4 real choices. Inactive cells open in Phase 1b.
 */
export const ACTIVE_CELLS: Record<SlotId, EraId[]> = {
  commander: ['antiquity', 'medieval', 'ww2', 'twenties'],
  ground: ['antiquity', 'medieval', 'gunpowder', 'ww2'],
  armor: ['antiquity', 'ww2'],
  air: ['antiquity', 'ww1', 'ww2', 'coldwar'],
  navy: ['medieval', 'sail', 'ww2'],
  intel: ['antiquity', 'ww2', 'coldwar'],
  logistics: ['antiquity', 'medieval', 'ww2'],
  wildcard: ['antiquity', 'twenties'],
}

/** All picks eligible for a cell: era matches and the slot is primary or secondary. */
export function cellPicks(era: EraId, slot: SlotId): Pick[] {
  return ALL_PICKS.filter(
    (p) => eraOf(p.year) === era && (p.slot === slot || p.altSlot === slot),
  ).sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))
}

export function daySeedFrom(key: string): number {
  return hashString(`undefeated//${key}`)
}

/** The 50 wars in chronological order, with seeded difficulty jitter and weather. */
export function buildSeason(daySeed: number): Game[] {
  const rng = mulberry32((daySeed ^ 0x51ed270b) >>> 0)
  const noiseRng = mulberry32((daySeed ^ 0x9e3779b9) >>> 0)
  return SLATE.map((kind, index) => ({
    index,
    kind,
    difficulty: kind.baseD + BAL.difficultyShift + (rng() * 2 - 1) * BAL.difficultyJitter,
    noise: normal(noiseRng) * BAL.noiseSigma,
  }))
}

/**
 * The day's eight requisition orders, in a daily-shuffled slot sequence.
 *
 * Eras never repeat across the board: assignment is a seeded perfect matching
 * (slots → distinct eras), so a day can't deal ANTIQUITY four times. Most-
 * constrained slots are assigned first; if a future cell configuration makes
 * distinctness impossible, the leftover slots gracefully accept repeats.
 * An Era Override may still introduce a duplicate — that's the player's call.
 */
export function buildOrders(daySeed: number): Requisition[] {
  const rng = mulberry32((daySeed ^ 0x08de15) >>> 0)
  const sequence = shuffled(SLOT_ORDER, rng)

  // Seeded preference order per slot, consumed in canonical order for determinism.
  const prefs = new Map<SlotId, EraId[]>()
  for (const slot of SLOT_ORDER) prefs.set(slot, shuffled(ACTIVE_CELLS[slot], rng))

  // Assign most-constrained slots first (stable sort keeps this deterministic).
  const solveOrder = [...SLOT_ORDER].sort(
    (a, b) => ACTIVE_CELLS[a].length - ACTIVE_CELLS[b].length,
  )
  const assigned: Partial<Record<SlotId, EraId>> = {}
  const used = new Set<EraId>()
  const solve = (i: number): boolean => {
    if (i >= solveOrder.length) return true
    const slot = solveOrder[i]
    for (const era of prefs.get(slot)!) {
      if (used.has(era)) continue
      used.add(era)
      assigned[slot] = era
      if (solve(i + 1)) return true
      used.delete(era)
      delete assigned[slot]
    }
    return false
  }
  solve(0)

  return sequence.map((slot) => {
    const era = assigned[slot] ?? prefs.get(slot)![0]
    const others = ACTIVE_CELLS[slot].filter((e) => e !== era)
    const altEra = others[Math.floor(rng() * others.length)]
    return { slot, era, altEra }
  })
}

export interface DailyContext {
  daySeed: number
  orders: Requisition[]
  games: Game[]
}

export function buildDaily(key: string): DailyContext {
  const daySeed = daySeedFrom(key)
  return { daySeed, orders: buildOrders(daySeed), games: buildSeason(daySeed) }
}

function normalizedWeights(kind: Game['kind']): Stats {
  const w = {} as Stats
  let sum = 0
  for (const k of STAT_KEYS) sum += kind.weights[k] ?? 0
  for (const k of STAT_KEYS) w[k] = (kind.weights[k] ?? 0) / (sum || 1)
  return w
}

/**
 * Teams are ordered by SLOT_ORDER: [commander, ground, armor, air, navy, intel,
 * logistics, wildcard]. Occupancy order matters (Branch Transfer can seat a
 * pick outside its primary slot), so the engine reads roles by index.
 */
const IDX = {
  commander: 0,
  air: SLOT_ORDER.indexOf('air'),
  navy: SLOT_ORDER.indexOf('navy'),
  intel: SLOT_ORDER.indexOf('intel'),
  logistics: SLOT_ORDER.indexOf('logistics'),
}

function pickWeighted(pick: Pick, w: Stats): number {
  let s = 0
  for (const k of STAT_KEYS) s += w[k] * pick.stats[k]
  return s
}

function pickExtras(pick: Pick, game: Game): number {
  let extra = 0
  for (const tag of game.kind.tags) {
    extra += (pick.terrain?.[tag] ?? 0) * BAL.terrainScale
  }
  const sp = pick.special
  if (
    sp &&
    (sp.trigger === 'any' ||
      sp.trigger === game.kind.id ||
      game.kind.tags.includes(sp.trigger as never) ||
      game.kind.tests.includes(sp.trigger))
  ) {
    extra += sp.bonus * BAL.specialScale
  }
  return extra
}

export interface CompatReport {
  /** Highest tech demand among non-logistics picks (with air/naval bumps at their max). */
  demand: number
  supply: number
  sustainGap: number
  spreadCenturies: number
  c2Mitigation: number
}

/** Team-level compatibility inputs — game-independent parts. */
export function compatOf(team: Pick[]): CompatReport {
  const logi = team[IDX.logistics]
  let demand = 0
  let minYear = Infinity
  let maxYear = -Infinity
  for (let i = 0; i < team.length; i++) {
    const p = team[i]
    if (p.year < minYear) minYear = p.year
    if (p.year > maxYear) maxYear = p.year
    if (i !== IDX.logistics && p.stats.tech > demand) demand = p.stats.tech
  }
  const supply = logi.stats.tech + 2
  const cmd = team[IDX.commander]
  const intel = team[IDX.intel]
  const c2Mitigation = Math.min(
    1,
    ((cmd.adaptability ?? 5) * 0.6 + intel.stats.int * 0.4) / 10,
  )
  return {
    demand,
    supply,
    sustainGap: Math.max(0, demand - supply),
    spreadCenturies: Math.max(0, (maxYear - minYear) / 100),
    c2Mitigation,
  }
}

/** Per-game compatibility penalty. */
function compatPenalty(compat: CompatReport, team: Pick[], game: Game, wLog: number): number {
  // Basing, folded in: air/naval wars raise the effective demand of your
  // air/naval pick by one.
  let demand = compat.demand
  if (game.kind.tags.includes('air')) demand = Math.max(demand, team[IDX.air].stats.tech + 1)
  if (game.kind.tags.includes('naval')) demand = Math.max(demand, team[IDX.navy].stats.tech + 1)
  const sustainGap = Math.max(0, demand - compat.supply)
  const sustain = sustainGap * (BAL.sustainBase + wLog * BAL.sustainLogWeight)
  const c2 =
    Math.sqrt(compat.spreadCenturies) *
    (1 - BAL.c2MitigationMax * compat.c2Mitigation) *
    BAL.c2Scale
  return sustain + c2
}

export function scoreGame(
  team: Pick[],
  game: Game,
): { margin: number; contributions: Record<string, number> } {
  const w = normalizedWeights(game.kind)
  const cmd = team[IDX.commander]
  const cmdMult = BAL.cmdBase + (cmd.leadership ?? 5) * BAL.cmdPerLeadership
  const compat = compatOf(team)

  let weightedSum = 0
  let extras = 0
  const contributions: Record<string, number> = {}
  for (const p of team) {
    const wpart = pickWeighted(p, w) / team.length
    const epart = pickExtras(p, game)
    weightedSum += wpart
    extras += epart
    contributions[p.id] = wpart * cmdMult + epart
  }

  const score = weightedSum * cmdMult + extras - compatPenalty(compat, team, game, w.log)
  return { margin: score - (game.difficulty + game.noise), contributions }
}

export function simulate(team: Pick[], games: Game[], daySeed: number): SeasonResult {
  const results: GameResult[] = games.map((game) => {
    const { margin, contributions } = scoreGame(team, game)
    return { game, won: margin > 0, margin, contributions }
  })
  const wins = results.filter((r) => r.won).length
  return { wins, losses: results.length - wins, results, team, daySeed }
}

/**
 * Exact enumeration over the day's cells (variable pool sizes, mixed radix).
 * Command HQ (the ceiling) plays the orders as dealt — no Override, no Transfer.
 * Pool sizes in Phase 1a keep this well under a million combos.
 */
export function rankTeams(cells: Pick[][], games: Game[], userWins: number): RankInfo {
  const winCounts = enumerateWins(cells, games)
  let bestWins = 0
  for (const w of winCounts) if (w > bestWins) bestWins = w
  const bestCount = winCounts.filter((w) => w === bestWins).length
  const perfectCount = winCounts.filter((w) => w === SEASON_LENGTH).length
  const better = winCounts.filter((w) => w > userWins).length
  const rank = better + 1
  const percentile = Math.round((1 - better / winCounts.length) * 100)
  return { rank, totalTeams: winCounts.length, bestWins, bestCount, perfectCount, percentile }
}

/** Season win count for every lineup in the cell space (mixed-radix enumeration). */
export function enumerateWins(cells: Pick[][], games: Game[]): number[] {
  const sizes = cells.map((c) => c.length)
  const total = sizes.reduce((a, b) => a * b, 1)

  // Precompute per-pick, per-game partials over the flattened option list.
  const flat: Pick[] = cells.flat()
  const offsets: number[] = []
  {
    let o = 0
    for (const c of cells) {
      offsets.push(o)
      o += c.length
    }
  }
  const weights = games.map((g) => normalizedWeights(g.kind))
  const weightedByGame: Float64Array[] = []
  const extrasByGame: Float64Array[] = []
  for (let gi = 0; gi < games.length; gi++) {
    const wRow = new Float64Array(flat.length)
    const eRow = new Float64Array(flat.length)
    for (let pi = 0; pi < flat.length; pi++) {
      wRow[pi] = pickWeighted(flat[pi], weights[gi])
      eRow[pi] = pickExtras(flat[pi], games[gi])
    }
    weightedByGame.push(wRow)
    extrasByGame.push(eRow)
  }
  const thresholds = games.map((g) => g.difficulty + g.noise)
  const wLogs = games.map((_, gi) => weights[gi].log)
  const airTag = games.map((g) => g.kind.tags.includes('air'))
  const navalTag = games.map((g) => g.kind.tags.includes('naval'))

  const winCounts: number[] = []
  const teamIdx = new Array<number>(cells.length)
  const team = new Array<Pick>(cells.length)

  for (let t = 0; t < total; t++) {
    let rem = t
    for (let s = 0; s < cells.length; s++) {
      const j = rem % sizes[s]
      rem = Math.floor(rem / sizes[s])
      teamIdx[s] = offsets[s] + j
      team[s] = cells[s][j]
    }
    const cmd = team[IDX.commander]
    const cmdMult = BAL.cmdBase + (cmd.leadership ?? 5) * BAL.cmdPerLeadership
    const compat = compatOf(team)
    const airTech = team[IDX.air].stats.tech
    const navyTech = team[IDX.navy].stats.tech
    const c2 =
      Math.sqrt(compat.spreadCenturies) *
      (1 - BAL.c2MitigationMax * compat.c2Mitigation) *
      BAL.c2Scale

    let wins = 0
    for (let gi = 0; gi < games.length; gi++) {
      const wRow = weightedByGame[gi]
      const eRow = extrasByGame[gi]
      let wSum = 0
      let eSum = 0
      for (let s = 0; s < cells.length; s++) {
        const pi = teamIdx[s]
        wSum += wRow[pi]
        eSum += eRow[pi]
      }
      let demand = compat.demand
      if (airTag[gi] && airTech + 1 > demand) demand = airTech + 1
      if (navalTag[gi] && navyTech + 1 > demand) demand = navyTech + 1
      const sustain =
        Math.max(0, demand - compat.supply) * (BAL.sustainBase + wLogs[gi] * BAL.sustainLogWeight)
      const score = (wSum / cells.length) * cmdMult + eSum - sustain - c2
      if (score > thresholds[gi]) wins++
    }
    winCounts.push(wins)
  }
  return winCounts
}

/** Human line for the debrief's integration report. */
export function compatSummary(team: Pick[]): string | null {
  const compat = compatOf(team)
  const logi = team[IDX.logistics]
  const notes: string[] = []
  if (compat.sustainGap >= 3) {
    notes.push(
      `${logi.name} (${ERA_LABELS[eraOf(logi.year)]}) could feed the army but not maintain its most advanced equipment`,
    )
  } else if (compat.sustainGap >= 1) {
    notes.push(`${logi.name} kept the advanced equipment running on improvisation and prayer`)
  }
  if (compat.spreadCenturies >= 10 && compat.c2Mitigation < 0.5) {
    notes.push(
      `orders crossed ${Math.round(compat.spreadCenturies)} centuries of doctrine with no one translating`,
    )
  } else if (compat.spreadCenturies >= 10) {
    notes.push(
      `${Math.round(compat.spreadCenturies)} centuries of doctrine gap, held together by adaptable command and good intelligence`,
    )
  }
  if (notes.length === 0) return null
  return `Integration report: ${notes.join('; ')}.`
}

export function marginLabel(margin: number): string {
  const m = Math.abs(margin)
  if (m < 0.25) return 'coin flip'
  if (m < 0.8) return 'narrow'
  if (m < 1.6) return 'decisive'
  return 'rout'
}
