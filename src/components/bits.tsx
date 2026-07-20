import type { ReactNode } from 'react'
import { STAT_KEYS, STAT_LABELS, TERRAIN_LABELS, type GameResult, type Pick, type Terrain } from '../game/types'
import { yearLabel } from '../game/roster'

export function ClassBar({ children }: { children: ReactNode }) {
  return <div className="classbar">{children}</div>
}

export function Stamp({
  tone,
  children,
  size = 'md',
}: {
  tone: 'red' | 'olive' | 'ink'
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  return <span className={`stamp stamp--${tone} stamp--${size}`}>{children}</span>
}

const STAT_SHORT: Record<string, string> = {
  atk: 'FIRE',
  def: 'DEF',
  mob: 'MOB',
  log: 'LOG',
  tech: 'TECH',
  grit: 'MRLE',
  int: 'INTL',
}

export function StatBars({ pick }: { pick: Pick }) {
  return (
    <div className="statbars">
      {STAT_KEYS.map((k) => (
        <div className="statbar" key={k} title={`${STAT_LABELS[k]}: ${pick.stats[k]}/10`}>
          <span className="statbar__label">{STAT_SHORT[k]}</span>
          <span className="statbar__track">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} className={i < pick.stats[k] ? 'on' : ''} />
            ))}
          </span>
          <span className="statbar__num">{pick.stats[k]}</span>
        </div>
      ))}
    </div>
  )
}

export function TerrainChips({ pick }: { pick: Pick }) {
  const entries = Object.entries(pick.terrain ?? {}) as [Terrain, number][]
  if (entries.length === 0 && !pick.special) return null
  return (
    <div className="chips">
      {entries.map(([t, v]) => (
        <span key={t} className={`chip ${v > 0 ? 'chip--good' : 'chip--bad'}`}>
          {TERRAIN_LABELS[t]} {v > 0 ? `+${v}` : v}
        </span>
      ))}
    </div>
  )
}

export function PickCard({
  pick,
  onPick,
  chosen,
  compact,
}: {
  pick: Pick
  onPick?: () => void
  chosen?: boolean
  compact?: boolean
}) {
  return (
    <article className={`card ${chosen ? 'card--chosen' : ''} ${compact ? 'card--compact' : ''}`}>
      <header className="card__head">
        <div>
          <h3 className="card__name">{pick.name}</h3>
          <p className="card__origin">{pick.origin}</p>
        </div>
        <span className="card__year">{yearLabel(pick.year)}</span>
      </header>
      <p className="card__blurb">“{pick.blurb}”</p>
      {!compact && <StatBars pick={pick} />}
      {!compact && <TerrainChips pick={pick} />}
      {!compact && pick.special && (
        <p className="card__special" title={`Bonus in matching wars`}>
          ★ {pick.special.label}
        </p>
      )}
      {onPick && (
        <button className="btn btn--ink card__draft" onClick={onPick}>
          Draft
        </button>
      )}
    </article>
  )
}

export function WLGrid({
  results,
  reveal,
  size = 'md',
}: {
  results: GameResult[]
  reveal?: number
  size?: 'sm' | 'md'
}) {
  const shown = reveal ?? results.length
  return (
    <div className={`wlgrid wlgrid--${size}`} role="img" aria-label="Season results grid">
      {results.map((r, i) => (
        <span
          key={i}
          className={`wlcell ${i < shown ? (r.won ? 'wlcell--w' : 'wlcell--l') : ''} ${r.game.marquee ? 'wlcell--marquee' : ''}`}
          title={`War ${i + 1}: ${r.won ? 'W' : 'L'} — ${r.game.name} vs ${r.game.enemy}`}
        />
      ))}
    </div>
  )
}
