/** Renders the downloadable share card (1080×1350 PNG) on a canvas. Pure drawing, no deps. */
import { gradeFor } from './narrate'
import { SLOT_ORDER, SLOT_SHORT, type RankInfo, type SeasonResult } from './types'
import { yearLabel } from './roster'

const W = 1080
const H = 1350

const PAPER = '#f2e9d3'
const INK = '#241f15'
const RED = '#9d2b1d'
const OLIVE = '#57573c'
const BRASS = '#8a6b2f'

export async function renderShareCard(
  season: SeasonResult,
  rank: RankInfo | null,
  dayNo: number | null,
): Promise<string> {
  await Promise.all([
    document.fonts.load('700 100px Staatliches'),
    document.fonts.load('400 40px "Special Elite"'),
    document.fonts.load('600 30px "IBM Plex Mono"'),
  ]).catch(() => undefined)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Paper.
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  // Subtle aging bands.
  for (let i = 0; i < 40; i++) {
    const y = (i * 997) % H
    ctx.fillStyle = i % 2 ? 'rgba(120,100,60,0.025)' : 'rgba(255,255,255,0.03)'
    ctx.fillRect(0, y, W, 18)
  }

  // Frame.
  ctx.strokeStyle = INK
  ctx.lineWidth = 6
  ctx.strokeRect(28, 28, W - 56, H - 56)
  ctx.lineWidth = 2
  ctx.strokeRect(42, 42, W - 84, H - 84)

  // Classification bar.
  ctx.fillStyle = RED
  ctx.fillRect(42, 66, W - 84, 54)
  ctx.fillStyle = PAPER
  ctx.font = '600 26px "IBM Plex Mono"'
  ctx.textAlign = 'center'
  ctx.fillText('DECLASSIFIED · DEPARTMENT OF ALTERNATE HISTORY', W / 2, 102)

  // Masthead.
  ctx.fillStyle = INK
  ctx.font = '400 150px Staatliches'
  ctx.fillText('UNDEFEATED', W / 2, 268)
  ctx.font = '600 28px "IBM Plex Mono"'
  ctx.fillStyle = OLIVE
  ctx.fillText('· THE ALL-TIME WAR DRAFT ·', W / 2, 312)
  ctx.fillStyle = INK
  ctx.font = '400 30px "Special Elite"'
  ctx.fillText(dayNo ? `Daily Draft No. ${dayNo}` : 'Free Play Campaign', W / 2, 360)

  // Record.
  ctx.font = '400 280px Staatliches'
  ctx.fillStyle = INK
  ctx.fillText(`${season.wins}–${season.losses}`, W / 2, 610)

  // Grade stamp.
  const grade = gradeFor(season.wins)
  ctx.save()
  ctx.translate(W / 2, 698)
  ctx.rotate(-0.045)
  ctx.strokeStyle = RED
  ctx.lineWidth = 6
  ctx.font = '400 64px Staatliches'
  const tw = ctx.measureText(grade.title).width
  ctx.globalAlpha = 0.9
  ctx.strokeRect(-tw / 2 - 28, -52, tw + 56, 88)
  ctx.fillStyle = RED
  ctx.fillText(grade.title, 0, 14)
  ctx.restore()

  // W/L grid — 50 wars, five rows of ten.
  const cols = 10
  const cell = 38
  const gap = 9
  const rows = Math.ceil(season.results.length / cols)
  const gridW = cols * cell + (cols - 1) * gap
  const gx = (W - gridW) / 2
  let gy = 756
  season.results.forEach((r, i) => {
    const cx = gx + (i % cols) * (cell + gap)
    const cy = gy + Math.floor(i / cols) * (cell + gap)
    ctx.fillStyle = r.won ? OLIVE : RED
    ctx.globalAlpha = r.won ? 0.85 : 0.95
    ctx.fillRect(cx, cy, cell, cell)
  })
  ctx.globalAlpha = 1
  gy += rows * (cell + gap) + 30

  // Roster.
  ctx.textAlign = 'left'
  const left = 92
  ctx.font = '600 25px "IBM Plex Mono"'
  const colGap = 500
  SLOT_ORDER.forEach((slot, i) => {
    const p = season.team.find((t) => t.slot === slot)
    if (!p) return
    const x = left + (i % 2) * colGap
    const y = gy + Math.floor(i / 2) * 44
    ctx.fillStyle = BRASS
    ctx.fillText(SLOT_SHORT[slot], x, y)
    ctx.fillStyle = INK
    const label = `${p.name} · ${yearLabel(p.year)}`
    ctx.fillText(label.length > 30 ? label.slice(0, 29) + '…' : label, x + 92, y)
  })
  gy += 4 * 44 + 34

  // Rank line.
  ctx.textAlign = 'center'
  ctx.font = '400 31px "Special Elite"'
  ctx.fillStyle = INK
  if (rank) {
    ctx.fillText(
      `Army #${rank.rank.toLocaleString()} of ${rank.totalTeams.toLocaleString()} possible today`,
      W / 2,
      gy,
    )
    gy += 44
  }

  // Footer.
  ctx.fillStyle = OLIVE
  ctx.font = '600 22px "IBM Plex Mono"'
  ctx.fillText('DRAFT HISTORY · BREAK THE TIMELINE · GO UNDEFEATED', W / 2, H - 64)

  return canvas.toDataURL('image/png')
}
