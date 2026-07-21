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

/** The ten draft eras. Rosters may be modern; scenarios stay ≤1991. */
export type EraId =
  | 'antiquity'
  | 'medieval'
  | 'gunpowder'
  | 'sail'
  | 'industrial'
  | 'ww1'
  | 'ww2'
  | 'coldwar'
  | 'postcold'
  | 'twenties'

export const ERA_ORDER: EraId[] = [
  'antiquity',
  'medieval',
  'gunpowder',
  'sail',
  'industrial',
  'ww1',
  'ww2',
  'coldwar',
  'postcold',
  'twenties',
]

export const ERA_LABELS: Record<EraId, string> = {
  antiquity: 'ANTIQUITY',
  medieval: 'MEDIEVAL',
  gunpowder: 'GUNPOWDER',
  sail: 'SAIL & EMPIRE',
  industrial: 'INDUSTRIAL',
  ww1: 'WWI & INTERWAR',
  ww2: 'WORLD WAR II',
  coldwar: 'COLD WAR',
  postcold: 'POST-COLD WAR',
  twenties: 'THE 2020s',
}

/** Plain-language era anchors: year span + three touchstones. Shown under the wheel. */
export const ERA_HINTS: Record<EraId, string> = {
  antiquity: 'to 500 CE · legions, phalanxes, war elephants',
  medieval: '500–1450 · knights, Mongols, castles',
  gunpowder: '1450–1700 · muskets, galleons, samurai',
  sail: '1700–1850 · Napoleon, redcoats, frigates',
  industrial: '1850–1913 · railroads, ironclads, empires',
  ww1: '1914–1938 · trenches, biplanes, the first tanks',
  ww2: '1939–1945 · the big one',
  coldwar: '1946–1991 · jets, submarines, spies',
  postcold: '1992–2019 · precision wars, peacekeepers',
  twenties: '2020s · drones, satellites, the news',
}

/** Era bucket from a snapshot year. */
export function eraOf(year: number): EraId {
  if (year <= 500) return 'antiquity'
  if (year <= 1450) return 'medieval'
  if (year <= 1700) return 'gunpowder'
  if (year <= 1850) return 'sail'
  if (year <= 1913) return 'industrial'
  if (year <= 1938) return 'ww1'
  if (year <= 1945) return 'ww2'
  if (year <= 1991) return 'coldwar'
  if (year <= 2019) return 'postcold'
  return 'twenties'
}

export type Authenticity = 'historical' | 'experimental' | 'legendary' | 'improvised'
export type Ruleset = 'core' | 'current-affairs' | 'special-event'
export type Tone = 'documentary' | 'comedic' | 'satirical'

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
  /** Primary slot (pool membership). */
  slot: SlotId
  /** Secondary slot eligibility, if any — powers Branch Transfer and cell lists. */
  altSlot?: SlotId
  name: string
  origin: string
  /** Snapshot year. Negative = BCE. Era bucket derives from this via eraOf(). */
  year: number
  blurb: string
  /**
   * Real conflict or war for the card's identity strip, e.g. 'World War II'.
   * When absent, the card falls back to the unit's era label (via eraOf).
   */
  conflict?: string
  /**
   * Plain-English one-line descriptor shown on the card face in place of the
   * blurb. When absent, the comedic blurb is shown. The blurb always stays in
   * the data for the debrief generator's lines.
   */
  descriptor?: string
  stats: Stats
  terrain?: Partial<Record<Terrain, number>>
  special?: Special
  /** Card provenance label. Default: 'historical'. */
  authenticity?: Authenticity
  /** Content ruleset. Default: 'core'. 'current-affairs' = living-figure satire (toggleable). */
  ruleset?: Ruleset
  /** Editorial register. Default: 'comedic'. */
  tone?: Tone
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
  /**
   * Doctrine/comms glue (0–2): signalling systems, courier networks, universal
   * references. Feeds C2 mitigation — the pick that lets eight centuries share
   * one map. Rare by design; most picks have none.
   */
  bridge?: number
}

/** One daily requisition order: fill this slot from this era. */
export interface Requisition {
  slot: SlotId
  era: EraId
  /** Predefined alternate era for this round's Era Override — same for every player. */
  altEra: EraId
  /**
   * Predefined partner chair for this round's Branch Override — same for every
   * player. Using it trades branches with the round that holds this chair: you
   * draft altSlot from this round's era now, and your original branch comes up
   * later under the partner round's era. Equals `slot` when the dealt board
   * offers no legal trade.
   */
  altSlot: SlotId
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
  /**
   * Optional seat-emphasis override: which chairs matter in this war, as
   * relative values (engine normalizes; unlisted seats default to 1). When
   * absent, emphasis derives from tags/tests — see slotEmphasisOf().
   */
  slotWeights?: Partial<Record<SlotId, number>>
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

