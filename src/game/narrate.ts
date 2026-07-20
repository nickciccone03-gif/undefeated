/** Turns a simulated season into the After-Action Report. Deterministic per (day, team). */
import { SEASON_LENGTH } from './engine'
import { mulberry32, pickOne, type Rng } from './rng'
import { yearLabel } from './roster'
import type { GameResult, Pick, RankInfo, SeasonResult, StatKey } from './types'

export interface FeaturedGame {
  label: string
  result: GameResult
  writeup: string
  unitLine?: string
}

export interface Debrief {
  gradeTitle: string
  gradeSub: string
  paragraphs: string[]
  featured: FeaturedGame[]
  mvp: { pick: Pick; note: string }
  scapegoat: { pick: Pick; note: string }
  fatalFlaw: string | null
  eraLine: string
}

export function gradeFor(wins: number): { title: string; sub: string } {
  if (wins >= 50) return { title: 'PERFECT SEASON', sub: 'History has formally surrendered.' }
  if (wins >= 46) return { title: 'FEARED ACROSS ALL ERAS', sub: 'Historians are pretending this was inevitable.' }
  if (wins >= 41) return { title: 'HALL OF FAME', sub: 'Statues are being argued about.' }
  if (wins >= 35) return { title: 'RESPECTABLE MENACE', sub: 'Neighboring centuries have requested a buffer zone.' }
  if (wins >= 29) return { title: 'MID EMPIRE', sub: 'Rises, falls, gets a two-part documentary.' }
  if (wins >= 23) return { title: 'CAUTIONARY TALE', sub: 'Taught in academies under “please don’t.”' }
  return { title: 'MUSEUM EXHIBIT', sub: 'Cautionary wing. Children point.' }
}

const FLAW_LINES: Record<StatKey, string> = {
  atk: 'Official doctrine on the attack was, verbatim, “ask nicely.”',
  def: 'Defense was treated as a rumor from a neighboring army.',
  mob: 'Your fastest formation was outpaced by continental drift.',
  log: 'Supplies kept arriving at wars that had ended forty years earlier.',
  tech: 'Your most advanced weapon system was a strongly worded letter.',
  grit: 'Morale folded faster than a camp chair in a hurricane.',
  int: 'Your intelligence briefings were, on inspection, horoscopes.',
}

const OPENINGS = [
  'In the year of nobody-in-particular, {cmd} assembled an army spanning {span} centuries and marched it into all fifty wars at once, chronologically.',
  'The recruiting posters made no sense in any single century, and yet they worked: {cmd} took an army {span} centuries deep to face history’s entire syllabus.',
  '{cmd} looked at fifty of history’s hardest military problems, said “all of them,” and signed the requisition form.',
]

const ARC_DOMINANT = [
  'What followed was less a season than a procession: three millennia of famous problems, dispatched in order, with receipts.',
  'The campaign map ran out of red push-pins somewhere around the gunpowder era. Quartermasters began issuing victories in bulk.',
]
const ARC_STRONG = [
  'The season was a drumbeat of victories interrupted by the occasional educational disaster.',
  'Your army marched from triumph to triumph, pausing only to lose in ways that would later become required reading.',
]
const ARC_MIXED = [
  'It was a season of magnificent wins and losses so instructive that three military academies changed their syllabus mid-year.',
  'The army alternated between unstoppable and deeply confused, sometimes within the same century.',
]
const ARC_ROUGH = [
  'The season is best described as a controlled experiment in humility, conducted across 2,500 years.',
  'The war college has requested your campaign records “for the blooper reel.”',
]

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
}

function contributionTotals(season: SeasonResult): Map<string, number> {
  const totals = new Map<string, number>()
  for (const r of season.results) {
    for (const [id, c] of Object.entries(r.contributions)) {
      totals.set(id, (totals.get(id) ?? 0) + c)
    }
  }
  return totals
}

function topUnitInGame(season: SeasonResult, r: GameResult): Pick {
  let best = season.team[0]
  let bestC = -Infinity
  for (const p of season.team) {
    const c = r.contributions[p.id] ?? 0
    if (c > bestC) {
      bestC = c
      best = p
    }
  }
  return best
}

function worstUnitInGame(season: SeasonResult, r: GameResult): Pick {
  let worst = season.team[0]
  let worstC = Infinity
  for (const p of season.team) {
    const c = r.contributions[p.id] ?? 0
    if (c < worstC) {
      worstC = c
      worst = p
    }
  }
  return worst
}

function fatalFlaw(season: SeasonResult): string | null {
  const losses = season.results.filter((r) => !r.won)
  if (losses.length === 0) return null
  const teamStats: Record<string, number> = {}
  for (const p of season.team) {
    for (const [k, v] of Object.entries(p.stats)) {
      teamStats[k] = (teamStats[k] ?? 0) + v / season.team.length
    }
  }
  const flawScore = new Map<StatKey, number>()
  for (const r of losses) {
    const kind = r.game.kind
    let sum = 0
    for (const v of Object.values(kind.weights)) sum += v
    for (const [k, wRaw] of Object.entries(kind.weights) as [StatKey, number][]) {
      const w = wRaw / (sum || 1)
      flawScore.set(k, (flawScore.get(k) ?? 0) + w * Math.max(0, 8 - (teamStats[k] ?? 5)))
    }
  }
  let worst: StatKey = 'log'
  let worstV = -Infinity
  for (const [k, v] of flawScore) {
    if (v > worstV) {
      worstV = v
      worst = k
    }
  }
  return FLAW_LINES[worst]
}

export function buildDebrief(
  season: SeasonResult,
  rank: RankInfo | null,
  integrationNote?: string | null,
): Debrief {
  const rng: Rng = mulberry32((season.daySeed ^ 0xdebf1e) >>> 0)
  const { wins } = season
  const grade = gradeFor(wins)
  const cmd = season.team.find((p) => p.slot === 'commander') ?? season.team[0]

  // Medals go to the troops — the commander answers for the season as a whole.
  const totals = contributionTotals(season)
  const byTotal = [...season.team]
    .filter((p) => p.slot !== 'commander')
    .sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0))
  const mvp = byTotal[0]
  const scapegoat = byTotal[byTotal.length - 1]

  const oldest = [...season.team].sort((a, b) => a.year - b.year)[0]
  const newest = [...season.team].sort((a, b) => b.year - a.year)[0]
  const span = Math.max(1, Math.round((newest.year - oldest.year) / 100))

  const sortedByMargin = [...season.results].sort((a, b) => b.margin - a.margin)
  const bestWin = sortedByMargin.find((r) => r.won) ?? null
  const worstLoss = [...sortedByMargin].reverse().find((r) => !r.won) ?? null
  const closest = [...season.results].sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin))[0]
  const finalBoss = season.results[season.results.length - 1]

  const paragraphs: string[] = []
  paragraphs.push(
    fill(pickOne(OPENINGS, rng), { cmd: cmd.name, span: String(span) }) +
      ` The oldest soldiers answered to ${oldest.name} standards (${yearLabel(oldest.year)}); the newest arrived from ${yearLabel(newest.year)}. History filed an objection. It was overruled.`,
  )

  const arcPool = wins >= 44 ? ARC_DOMINANT : wins >= 36 ? ARC_STRONG : wins >= 27 ? ARC_MIXED : ARC_ROUGH
  paragraphs.push(pickOne(arcPool, rng))

  if (bestWin) {
    const star = topUnitInGame(season, bestWin)
    paragraphs.push(
      `The masterpiece was ${bestWin.game.kind.name} (${bestWin.game.kind.era}). ` +
        fill(pickOne(bestWin.game.kind.winTemplates, rng), { unit: star.name }) +
        ` ${star.lines.win}`,
    )
  }

  if (worstLoss) {
    const goat = worstUnitInGame(season, worstLoss)
    const flaw = fatalFlaw(season)
    paragraphs.push(
      `The disaster was ${worstLoss.game.kind.name} (${worstLoss.game.kind.era}). ` +
        fill(pickOne(worstLoss.game.kind.lossTemplates, rng), { unit: goat.name }) +
        ` ${goat.lines.loss}` +
        (flaw ? ` The inquiry found the root cause: ${flaw.toLowerCase()}` : ''),
    )
  }

  if (span >= 5) {
    const anaPick = newest.lines.ana ? newest : oldest.lines.ana ? oldest : null
    if (anaPick?.lines.ana) {
      paragraphs.push(`Cross-era integration remained, per the after-action report, “a work in progress.” ${anaPick.lines.ana}`)
    }
  }

  if (integrationNote) paragraphs.push(integrationNote)

  let verdict = `The Department of Alternate History has graded your season: ${grade.title}.`
  if (rank) {
    verdict += ` Of the ${rank.totalTeams.toLocaleString()} armies Command HQ could raise from the orders as dealt, yours finished #${rank.rank.toLocaleString()}.`
    if (wins >= SEASON_LENGTH) {
      verdict += ` Only ${rank.perfectCount} draft${rank.perfectCount === 1 ? '' : 's'} could go 50–0 today. Yours is one of them.`
    } else if (rank.perfectCount > 0) {
      verdict += ` ${rank.perfectCount} possible draft${rank.perfectCount === 1 ? '' : 's'} could have gone 50–0 today. Yours, famously, was not among them.`
    } else {
      verdict += ` No as-dealt draft could go 50–0 today — Command HQ’s ceiling was ${rank.bestWins}–${SEASON_LENGTH - rank.bestWins}. The Department classifies boards like this one as “character-building.”`
    }
  }
  paragraphs.push(verdict)

  const featured: FeaturedGame[] = []
  if (bestWin) {
    const star = topUnitInGame(season, bestWin)
    featured.push({
      label: 'CAMPAIGN OF THE YEAR',
      result: bestWin,
      writeup: fill(pickOne(bestWin.game.kind.winTemplates, rng), { unit: star.name }),
      unitLine: star.lines.win,
    })
  }
  if (worstLoss) {
    const goat = worstUnitInGame(season, worstLoss)
    featured.push({
      label: 'THE DISASTER',
      result: worstLoss,
      writeup: fill(pickOne(worstLoss.game.kind.lossTemplates, rng), { unit: goat.name }),
      unitLine: goat.lines.loss,
    })
  }
  if (closest && closest !== bestWin && closest !== worstLoss) {
    const unit = topUnitInGame(season, closest)
    featured.push({
      label: closest.won ? 'THE HEART ATTACK' : 'THE ONE THAT GOT AWAY',
      result: closest,
      writeup: closest.won
        ? `Decided by a coin flip that your army had, barely, weighted. ${unit.name} tipped it.`
        : `A coin-flip war that landed on its edge, wobbled, and fell the wrong way.`,
    })
  }
  if (finalBoss && finalBoss !== bestWin && finalBoss !== worstLoss && finalBoss !== closest) {
    const star = finalBoss.won ? topUnitInGame(season, finalBoss) : worstUnitInGame(season, finalBoss)
    featured.push({
      label: 'THE FINAL EXAM',
      result: finalBoss,
      writeup: fill(
        pickOne(finalBoss.won ? finalBoss.game.kind.winTemplates : finalBoss.game.kind.lossTemplates, rng),
        { unit: star.name },
      ),
    })
  }

  return {
    gradeTitle: grade.title,
    gradeSub: grade.sub,
    paragraphs,
    featured,
    mvp: { pick: mvp, note: mvp.lines.win },
    scapegoat: { pick: scapegoat, note: scapegoat.lines.loss },
    fatalFlaw: fatalFlaw(season),
    eraLine: `${oldest.name} (${yearLabel(oldest.year)}) → ${newest.name} (${yearLabel(newest.year)}) — ${span} centuries of HR paperwork`,
  }
}
