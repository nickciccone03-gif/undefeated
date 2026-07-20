/** Wordle-style clipboard share text. */
import { gradeFor } from './narrate'
import type { RankInfo, SeasonResult } from './types'

export function shareText(season: SeasonResult, rank: RankInfo | null, dayNo: number | null): string {
  const grade = gradeFor(season.wins)
  const cmd = season.team.find((p) => p.slot === 'commander')
  const rows: string[] = []
  const cells = season.results.map((r) => (r.won ? '🟩' : '🟥'))
  for (let i = 0; i < cells.length; i += 14) {
    rows.push(cells.slice(i, i + 14).join(''))
  }
  const lines = [
    `UNDEFEATED ${dayNo ? `— Draft No. ${dayNo}` : '— Free Play'}`,
    `⚔️ ${season.wins}–${season.losses} · ${grade.title}`,
    ...rows,
    cmd ? `CMDR: ${cmd.name}` : '',
    rank ? `Army #${rank.rank.toLocaleString()} of ${rank.totalTeams.toLocaleString()} possible today` : '',
  ].filter(Boolean)
  return lines.join('\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
