import { useState } from 'react'
import { ClassBar, Stamp } from './bits'
import { dayNumber } from '../game/rng'

export function Title({
  playedToday,
  stats,
  onDaily,
  onFree,
}: {
  playedToday: { wins: number; losses: number } | null
  stats: { played: number; best: number; streak: number }
  onDaily: () => void
  onFree: () => void
}) {
  const [dossierOpen, setDossierOpen] = useState(false)
  const dayNo = dayNumber()

  return (
    <div className="title">
      <ClassBar>DECLASSIFIED · DEPARTMENT OF ALTERNATE HISTORY · PARODY DIVISION</ClassBar>

      <div className="title__mast">
        <p className="title__pre">THE ALL-TIME WAR DRAFT</p>
        <h1 className="title__word">UNDEFEATED</h1>
        <p className="title__tag">
          Draft an army across 3,000 years. Fight all 82 wars. <em>Try</em> to go undefeated.
        </p>
      </div>

      <div className="title__stampline" aria-hidden="true">
        <Stamp tone="red" size="lg">TOP SECRET-ISH</Stamp>
      </div>

      <div className="title__actions">
        <button className="btn btn--red btn--big" onClick={onDaily}>
          {playedToday
            ? `View today’s debrief (${playedToday.wins}–${playedToday.losses})`
            : `Play Daily Draft No. ${dayNo}`}
        </button>
        <button className="btn btn--ink" onClick={onFree}>
          Free play — random timeline
        </button>
      </div>

      <dl className="title__stats">
        <div>
          <dt>Campaigns</dt>
          <dd>{stats.played}</dd>
        </div>
        <div>
          <dt>Best record</dt>
          <dd>{stats.played ? `${stats.best}–${82 - stats.best}` : '—'}</dd>
        </div>
        <div>
          <dt>Day streak</dt>
          <dd>{stats.streak}</dd>
        </div>
      </dl>

      <button className="linkish" onClick={() => setDossierOpen((v) => !v)}>
        {dossierOpen ? '▾ Close the dossier' : '▸ Open the dossier (how it works)'}
      </button>

      {dossierOpen && (
        <div className="dossier">
          <h2 className="h-rule">FIELD MANUAL</h2>
          <ol>
            <li>
              <strong>Draft 8 units</strong> — commander, ground, armor, air, navy, intelligence,
              logistics, and one wild card. Three candidates per slot. Everyone gets the same board
              today.
            </li>
            <li>
              <strong>Fight the season</strong> — 82 wars across every terrain history offers:
              frozen marches, jungle labyrinths, absurd fronts.
            </li>
            <li>
              <strong>Mind the timeline</strong> — an army spanning 25 centuries pays an
              anachronism tax. A jet fighter is only as good as the medieval supply corps fueling
              it. Adaptable commanders soften the damage.
            </li>
            <li>
              <strong>Exploit specials</strong> — the Sacred Geese win night ambushes. Emus win
              wars that make no sense. Draft accordingly.
            </li>
          </ol>
          <p className="dossier__note">
            A parody of fantasy sports and military history. Records are deterministic: the same
            draft always produces the same season, so arguments can be settled with a rematch.
            No timelines were harmed.
          </p>
        </div>
      )}
    </div>
  )
}
