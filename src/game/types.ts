/** Core game types for UNDEFEATED — The All-Time War Draft. */

export type SlotId =
  | 'commander'
  | 'ground'
  | 'armor'
  | 'air'
  | 'navy'
  | 'intel'
  | 'logistics'
  | 'wildcard'

export const SLOT_ORDER: SlotId[] = [
  'commander',
  'ground',
  'armor',
  'air',
  'navy',
  'intel',
  'logistics',
  'wildcard',
]

export const SLOT_LABELS: Record<SlotId, string> = {
  commander: 'Supreme Commander',
  ground: 'Ground Forces',
  armor: 'Armor & Artillery',
  air: 'Air Power',
  navy: 'Navy',
  intel: 'Intelligence',
  logistics: 'Logistics',
  wildcard: 'Wild Card',
}

export const SLOT_SHORT: Record<SlotId, string> = {
  commander: 'CMDR',
  ground: 'GRND',
  armor: 'ARMR',
  air: 'AIR',
  navy: 'NAVY',
  intel: 'INTL',
  logistics: 'LOGI',
  wildcard: 'WILD',
}

export type StatKey = 'atk' | 'def' | 'mob' | 'log' | 'tech' | 'grit' | 'int'

export const STAT_KEYS: StatKey[] = ['atk', 'def', 'mob', 'log', 'tech', 'grit', 'int']

export const STAT_LABELS: Record<StatKey, string> = {
  atk: 'Firepower',
  def: 'Defense',
  mob: 'Mobility',
  log: 'Logistics',
  tech: 'Technology',
  grit: 'Morale',
  int: 'Intelligence',
}

export type Stats = Record<StatKey, number>

export type Terrain =
  | 'open'
  | 'winter'
  | 'desert'
  | 'jungle'
  | 'mountain'
  | 'urban'
  | 'naval'
  | 'air'
  | 'steppe'
  | 'night'

export const TERRAIN_LABELS: Record<Terrain, string> = {
  open: 'Open Field',
  winter: 'Winter',
  desert: 'Desert',
  jungle: 'Jungle',
  mountain: 'Mountains',
  urban: 'Urban / Siege',
  naval: 'Naval',
  air: 'Air',
  steppe: 'Steppe',
  night: 'Night Ops',
}

/** A special rule that fires when the pick's trigger matches a campaign's tags or kind. */
export interface Special {
  /** Terrain tag or campaign-kind id that triggers the bonus, or 'any' for every war. */
  trigger: Terrain | string
  bonus: number
  label: string
}

export interface Pick {
  id: string
  slot: SlotId
  name: string
  origin: string
  /** Negative = BCE. */
  year: number
  blurb: string
  stats: Stats
  terrain?: Partial<Record<Terrain, number>>
  special?: Special
  /** Bespoke joke lines used by the debrief generator. */
  lines: {
    win: string
    loss: string
    /** Anachronism joke — used when this pick sits at the far end of the team's timeline. */
    ana?: string
  }
  /** Commander-only. */
  leadership?: number
  adaptability?: number
}

/**
 * One of the 50 historical challenge cards. Each is a military problem, not a
 * re-enactment: the player's anachronistic army faces the war's defining challenge.
 */
export interface CampaignKind {
  id: string
  /** Historical name, e.g. "Normandy". */
  name: string
  /** The comedy subtitle, e.g. "The Stormed Shore". */
  subtitle: string
  /** Display era, e.g. "1944" or "480 BCE". */
  era: string
  /** The military problem, phrased as an objective. */
  objective: string
  role: 'attacker' | 'defender'
  tags: Terrain[]
  /**
   * What this war tests — controlled vocabulary used for special-rule triggers
   * and slate-balance linting: naval, air, airsup, siege, irregular, logistics,
   * supply, intel, coalition, defense, amphibious, blitz, trench, expedition,
   * propaganda, absurd, blockade.
   */
  tests: string[]
  /** Partial weights over stats; normalized by the engine. */
  weights: Partial<Stats>
  baseD: number
  /** Boss cards: harder, held on-screen longer, narratively loud. */
  boss?: boolean
  /** Templates for featured-game write-ups. {unit} is substituted. */
  winTemplates: string[]
  lossTemplates: string[]
}

export interface Game {
  index: number
  kind: CampaignKind
  difficulty: number
  noise: number
}

export interface GameResult {
  game: Game
  won: boolean
  margin: number
  /** Per-pick contribution this game (weighted stats + terrain + special). */
  contributions: Record<string, number>
}

export interface SeasonResult {
  wins: number
  losses: number
  results: GameResult[]
  team: Pick[]
  daySeed: number
}

export interface RankInfo {
  rank: number
  totalTeams: number
  bestWins: number
  bestCount: number
  perfectCount: number
  percentile: number
}

export interface DraftBoard {
  /** For each slot, the 3 candidate picks offered today. */
  options: Record<SlotId, Pick[]>
}
