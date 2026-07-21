import { useState } from 'react'
import { ClassBar, Stamp } from './bits'
import { dayNumber } from '../game/rng'
import type { Settings } from '../game/storage'

export function Title({
  playedToday,
  stats,
  settings,
  onSettings,
  onDaily,
  onFree,
}: {
  playedToday: { wins: number; losses: number } | null
  stats: { played: number; best: number; streak: number }
  settings: Settings
  onSettings: (patch: Partial<Settings>) => void
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
          Fifty wars. One impossible army. <em>Can you go 50–0?</em>
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
          <dd>{stats.played ? `${stats.best}–${50 - stats.best}` : '—'}</dd>
        </div>
        <div>
          <dt>Day streak</dt>
          <dd>{stats.streak}</dd>
        </div>
      </dl>

      <div className="title__toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.hideStats}
            onChange={(e) => onSettings({ hideStats: e.target.checked })}
          />
          <span>Field Promotion mode — draft blind, stats hidden</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.excludeLeaders}
            onChange={(e) => onSettings({ excludeLeaders: e.target.checked })}
          />
          <span>Exclude current leaders (hides 2020s politicians from your lists)</span>
        </label>
      </div>

      <button className="linkish" onClick={() => setDossierOpen((v) => !v)}>
        {dossierOpen ? '▾ Close the dossier' : '▸ Open the dossier (how it works)'}
      </button>

      {dossierOpen && (
        <div className="dossier">
          <h2 className="h-rule">FIELD MANUAL</h2>
          <ol>
            <li>
              <strong>Draft 8 units</strong> — the wheel deals each chair an era (ANTIQUITY through
              THE 2020s — each comes with a plain-language cheat line) and you pick anyone from that
              era's full pool. Everyone gets the same board today.
            </li>
            <li>
              <strong>Two re-rolls per round</strong> — don't like the deal? Spin the era again,
              spin the branch again, or both. You keep what you land on, and a re-rolled branch
              comes back up in a later round (the army still needs all eight chairs). Dual-role
              units can also Branch Transfer between chairs, once per round.
            </li>
            <li>
              <strong>March through history</strong> — all 50 of its defining wars, in
              chronological order, from the Hot Gates to the Gulf. Five are boss fights.
              The ceiling varies by day; perfection is not always on the menu.
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
