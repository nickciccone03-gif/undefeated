/**
 * Deterministic war engine.
 *
 * Everyone playing the same day sees the same draft board and the same fixed,
 * chronological 50-war slate with the same per-war "weather" (noise). Outcomes
 * depend only on (day, your picks) — identical armies always produce identical
 * records, so records are globally comparable.
 *
 * Daily ceilings vary on purpose: some boards can go 50–0, some max out at 47–3.
 * The board is never rerolled to guarantee perfection — hard days are content
 * ("DAILY CEILING: 47–3"), and rerolling would bias the game away from its
 * funniest requisitions. See DECISIONS.md.
 */
import { SLATE } from './campaigns'
import { POOLS } from './roster'
import { hashString, mulberry32, normal, shuffled } from './rng'
import {
  SLOT_ORDER,
  STAT_KEYS,
  type DraftBoard,
  type Game,
  type GameResult,
  type Pick,
  type RankInfo,
  type SeasonResult,
  type SlotId,
  type Stats,
} from './types'

export const SEASON_LENGTH = SLATE.length // 50
export const OPTIONS_PER_SLOT = 3

/** Balance constants — tuned via scripts/balance.ts. */
export const BAL = {
  noiseSigma: 0.9,
  terrainScale: 0.16,
  specialScale: 0.7,
  taxK: 0.26,
  cmdBase: 0.85,
  cmdPerLeadership: 0.035,
  difficultyJitter: 0.3,
  difficultyShift: -0.22,
}

export function daySeedFrom(key: string): number {
  return hashString(`undefeated//${key}`)
}

/** A draft board: 3 candidates per slot, derived purely from the seed. */
export function buildDraft(daySeed: number): DraftBoard {
  const options = {} as Record<SlotId, Pick[]>
  for (const slot of SLOT_ORDER) {
    const rng = mulberry32((daySeed ^ hashString(slot)) >>> 0)
    options[slot] = shuffled(POOLS[slot], rng).slice(0, OPTIONS_PER_SLOT)
  }
  return { options }
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

export interface DailyContext {
  daySeed: number
  board: DraftBoard
  games: Game[]
}

/** One key → one board. No rerolls: the ceiling is whatever history dealt today. */
export function buildDaily(key: string): DailyContext {
  const daySeed = daySeedFrom(key)
  return { daySeed, board: buildDraft(daySeed), games: buildSeason(daySeed) }
}

function normalizedWeights(kind: Game['kind']): Stats {
  const w = {} as Stats
  let sum = 0
  for (const k of STAT_KEYS) sum += kind.weights[k] ?? 0
  for (const k of STAT_KEYS) w[k] = (kind.weights[k] ?? 0) / (sum || 1)
  return w
}

function commanderOf(team: Pick[]): Pick {
  return team.find((p) => p.slot === 'commander') ?? team[0]
}

/** Weighted-stat contribution of one pick to one game (before the /8 team average). */
function pickWeighted(pick: Pick, w: Stats): number {
  let s = 0
  for (const k of STAT_KEYS) s += w[k] * pick.stats[k]
  return s
}

/** Terrain + special contribution of one pick to one game. */
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

function eraSpreadCenturies(team: Pick[]): number {
  let min = Infinity
  let max = -Infinity
  for (const p of team) {
    if (p.year < min) min = p.year
    if (p.year > max) max = p.year
  }
  return Math.max(0, (max - min) / 100)
}

function taxFor(team: Pick[], wLog: number): number {
  const cmd = commanderOf(team)
  const adapt = cmd.adaptability ?? 5
  const adaptFactor = 1.05 - adapt * 0.055
  const logFactor = 0.55 + wLog * 2.2
  return BAL.taxK * Math.sqrt(eraSpreadCenturies(team)) * adaptFactor * logFactor
}

export function scoreGame(team: Pick[], game: Game): { margin: number; contributions: Record<string, number> } {
  const w = normalizedWeights(game.kind)
  const cmd = commanderOf(team)
  const cmdMult = BAL.cmdBase + (cmd.leadership ?? 5) * BAL.cmdPerLeadership

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

  const score = weightedSum * cmdMult + extras - taxFor(team, w.log)
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
 * Evaluate every possible team from today's board (3^8 = 6,561) and rank the
 * player's record among them. Also powers the daily perfect-season reroll.
 */
export function rankTeams(board: DraftBoard, games: Game[], userWins: number): RankInfo {
  const slots = SLOT_ORDER.map((s) => board.options[s])

  // Precompute per-option, per-game partials.
  const flat: Pick[] = slots.flat()
  const idx = new Map(flat.map((p, i) => [p.id, i]))
  const weightedByGame: Float64Array[] = []
  const extrasByGame: Float64Array[] = []
  const weights = games.map((g) => normalizedWeights(g.kind))
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
  const taxBase = games.map((_, gi) => BAL.taxK * (0.55 + weights[gi].log * 2.2))

  const winCounts: number[] = []
  const combo = new Array<number>(8).fill(0)
  const teamIdx = new Array<number>(8)

  const total = Math.pow(OPTIONS_PER_SLOT, 8)
  for (let t = 0; t < total; t++) {
    let rem = t
    for (let s = 0; s < 8; s++) {
      combo[s] = rem % OPTIONS_PER_SLOT
      rem = Math.floor(rem / OPTIONS_PER_SLOT)
    }
    let minYear = Infinity
    let maxYear = -Infinity
    for (let s = 0; s < 8; s++) {
      const p = slots[s][combo[s]]
      teamIdx[s] = idx.get(p.id)!
      if (p.year < minYear) minYear = p.year
      if (p.year > maxYear) maxYear = p.year
    }
    const cmd = slots[0][combo[0]]
    const cmdMult = BAL.cmdBase + (cmd.leadership ?? 5) * BAL.cmdPerLeadership
    const adaptFactor = 1.05 - (cmd.adaptability ?? 5) * 0.055
    const spreadTerm = Math.sqrt(Math.max(0, (maxYear - minYear) / 100)) * adaptFactor

    let wins = 0
    for (let gi = 0; gi < games.length; gi++) {
      const wRow = weightedByGame[gi]
      const eRow = extrasByGame[gi]
      let wSum = 0
      let eSum = 0
      for (let s = 0; s < 8; s++) {
        const pi = teamIdx[s]
        wSum += wRow[pi]
        eSum += eRow[pi]
      }
      const score = (wSum / 8) * cmdMult + eSum - taxBase[gi] * spreadTerm
      if (score > thresholds[gi]) wins++
    }
    winCounts.push(wins)
  }

  let bestWins = 0
  for (const w of winCounts) if (w > bestWins) bestWins = w
  const bestCount = winCounts.filter((w) => w === bestWins).length
  const perfectCount = winCounts.filter((w) => w === SEASON_LENGTH).length
  const better = winCounts.filter((w) => w > userWins).length
  const rank = better + 1
  const percentile = Math.round((1 - better / winCounts.length) * 100)

  return { rank, totalTeams: winCounts.length, bestWins, bestCount, perfectCount, percentile }
}

export function marginLabel(margin: number): string {
  const m = Math.abs(margin)
  if (m < 0.25) return 'coin flip'
  if (m < 0.8) return 'narrow'
  if (m < 1.6) return 'decisive'
  return 'rout'
}
