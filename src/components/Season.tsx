import { useEffect, useRef, useState } from 'react'
import { ClassBar, Stamp, WLGrid } from './bits'
import type { SeasonResult } from '../game/types'

const FIRST_MS = 500
const BASE_MS = 120
const BOSS_HOLD_MS = 1050
const FINISH_MS = 900

export function Season({ season, onDone }: { season: SeasonResult; onDone: () => void }) {
  const [idx, setIdx] = useState(0) // number of resolved wars
  const doneRef = useRef(false)
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const total = season.results.length

  useEffect(() => {
    if (reduced) {
      setIdx(total)
      const t = setTimeout(onDone, 600)
      return () => clearTimeout(t)
    }
    if (idx >= total) {
      if (!doneRef.current) {
        doneRef.current = true
        const t = setTimeout(onDone, FINISH_MS)
        return () => clearTimeout(t)
      }
      return
    }
    // Hold longer on a just-resolved boss war so the stamp can land.
    const delay = idx === 0 ? FIRST_MS : season.results[idx - 1].game.kind.boss ? BOSS_HOLD_MS : BASE_MS
    const t = setTimeout(() => setIdx((i) => i + 1), delay)
    return () => clearTimeout(t)
  }, [idx, total, season, onDone, reduced])

  const wins = season.results.slice(0, idx).filter((r) => r.won).length
  const losses = idx - wins
  const shown = season.results[Math.max(0, Math.min(idx - 1, total - 1))]
  const resolved = idx > 0
  const finished = idx >= total
  const kind = shown.game.kind

  return (
    <div className="season">
      <ClassBar>
        MARCHING THROUGH HISTORY · WAR {Math.max(1, Math.min(idx, total))} OF {total}
      </ClassBar>

      <div className="season__score" aria-live="polite">
        <span className="season__record">
          {wins}–{losses}
        </span>
        <span className="season__recordLabel">RUNNING RECORD</span>
      </div>

      <div className={`season__now ${kind.boss ? 'season__now--boss' : ''}`} key={resolved ? idx : 'first'}>
        {kind.boss && <p className="season__boss">★ BOSS FIGHT ★</p>}
        <h2 className="season__war">{kind.name}</h2>
        <p className="season__enemy">
          {kind.era} · {kind.subtitle}
        </p>
        <p className="season__desc">
          {kind.role === 'attacker' ? 'You attack' : 'You defend'} — {kind.objective}
        </p>
        <div className="season__stampzone">
          {resolved ? (
            <div className="season__stamp" key={`stamp-${idx}`}>
              <Stamp tone={shown.won ? 'olive' : 'red'} size="lg">
                {shown.won ? 'VICTORY' : 'DEFEAT'}
              </Stamp>
            </div>
          ) : (
            <p className="season__engaging">ENGAGING…</p>
          )}
        </div>
      </div>

      <WLGrid results={season.results} reveal={idx} />

      <div className="season__foot">
        {!finished ? (
          <button className="btn btn--ghost" onClick={() => setIdx(total)}>
            Skip to the debrief
          </button>
        ) : (
          <p className="season__done">Compiling after-action report…</p>
        )}
      </div>
    </div>
  )
}
