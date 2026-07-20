/** localStorage persistence: daily results, streaks, bests. */

export interface DayRecord {
  picks: string[]
  wins: number
  losses: number
}

interface SaveData {
  days: Record<string, DayRecord>
}

const KEY = 'undefeated:v1'

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

export function setDayRecord(dayKey: string, record: DayRecord): void {
  const data = load()
  data.days[dayKey] = record
  save(data)
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
