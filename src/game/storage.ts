/** localStorage persistence: daily results (versioned), streaks, bests, settings. */
import { ROSTER_VERSION, RULESET_VERSION, SCENARIO_VERSION } from './engine'

export interface DayRecord {
  picks: string[]
  wins: number
  losses: number
  rosterVersion: number
  rulesetVersion: number
  scenarioVersion: number
}

export interface Settings {
  /** Hide current-affairs (living-leader) cards from YOUR draft lists. */
  excludeLeaders: boolean
  /** Field Promotion mode: draft blind — stats hidden. */
  hideStats: boolean
}

interface SaveData {
  days: Record<string, DayRecord>
  settings?: Settings
}

// v3: Requisition Wheel + compatibility model. Older records are retired with honors —
// the scoring model changed, and old results are never silently recomputed.
const KEY = 'undefeated:v3'

const DEFAULT_SETTINGS: Settings = { excludeLeaders: false, hideStats: false }

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as SaveData
  } catch {
    /* fresh start */
  }
  return { days: {} }
}

function save(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* private mode etc. — the war must go on */
  }
}

export function getDayRecord(dayKey: string): DayRecord | null {
  return load().days[dayKey] ?? null
}

/** A record is replayable only under the exact content versions that produced it. */
export function isCurrentVersion(r: DayRecord): boolean {
  return (
    r.rosterVersion === ROSTER_VERSION &&
    r.rulesetVersion === RULESET_VERSION &&
    r.scenarioVersion === SCENARIO_VERSION
  )
}

export function setDayRecord(dayKey: string, record: Omit<DayRecord, 'rosterVersion' | 'rulesetVersion' | 'scenarioVersion'>): void {
  const data = load()
  data.days[dayKey] = {
    ...record,
    rosterVersion: ROSTER_VERSION,
    rulesetVersion: RULESET_VERSION,
    scenarioVersion: SCENARIO_VERSION,
  }
  save(data)
}

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(load().settings ?? {}) }
}

export function setSettings(patch: Partial<Settings>): Settings {
  const data = load()
  data.settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}), ...patch }
  save(data)
  return data.settings
}

export function getStats(): { played: number; best: number; streak: number } {
  const data = load()
  const keys = Object.keys(data.days).sort()
  const played = keys.length
  let best = 0
  for (const k of keys) best = Math.max(best, data.days[k].wins)

  let streak = 0
  const d = new Date()
  for (;;) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (data.days[key]) {
      streak++
      d.setDate(d.getDate() - 1)
    } else if (streak === 0) {
      // Today not played yet — check if the streak survives from yesterday.
      d.setDate(d.getDate() - 1)
      const yKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!data.days[yKey]) break
    } else {
      break
    }
  }
  return { played, best, streak }
}
