import { useEffect, useState } from 'react'
import { ClassBar, PickCard, Stamp, WLGrid } from './bits'
import { marginLabel, ROSTER_VERSION, RULESET_VERSION, SCENARIO_VERSION } from '../game/engine'
import type { Debrief as DebriefData } from '../game/narrate'
import { copyToClipboard, shareText } from '../game/share'
import { renderShareCard } from '../game/shareCard'
import type { RankInfo, SeasonResult } from '../game/types'

export function Debrief({
  season,
  rank,
  debrief,
  dayNo,
  onHome,
  onFree,
}: {
  season: SeasonResult
  rank: RankInfo | null
  debrief: DebriefData
  dayNo: number | null
  onHome: () => void
  onFree: () => void
}) {
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle')

  useEffect(() => {
    let alive = true
    renderShareCard(season, rank, dayNo).then((url) => {
      if (alive) setCardUrl(url)
    })
    return () => {
      alive = false
    }
  }, [season, rank, dayNo])

  const doCopy = async () => {
    const ok = await copyToClipboard(shareText(season, rank, dayNo))
    setCopyState(ok ? 'ok' : 'fail')
    if (ok) setTimeout(() => setCopyState('idle'), 2200)
  }

  return (
    <div className="debrief">
      <ClassBar>AFTER-ACTION REPORT · {dayNo ? `DAILY DRAFT No. ${dayNo}` : 'FREE PLAY'}</ClassBar>

      <section className="debrief__verdict">
        <p className="debrief__final">FINAL RECORD</p>
        <p className="debrief__record">
          {season.wins}–{season.losses}
        </p>
        <div className="debrief__grade">
          <Stamp tone="red" size="lg">
            {debrief.gradeTitle}
          </Stamp>
        </div>
        <p className="debrief__gradesub">{debrief.gradeSub}</p>
        {rank && (
          <div className="debrief__rankchips">
            <span className="chip chip--ink">
              ARMY #{rank.rank.toLocaleString()} of {rank.totalTeams.toLocaleString()}
            </span>
            <span className="chip chip--ink">TOP {Math.max(1, 100 - rank.percentile)}%</span>
            <span className="chip chip--ink">
              BEST POSSIBLE TODAY: {rank.bestWins}–{50 - rank.bestWins} (×{rank.bestCount})
            </span>
          </div>
        )}
      </section>

      <section className="debrief__report">
        <h2 className="h-rule">SEASON REPORT</h2>
        {debrief.paragraphs.map((p, i) => (
          <p className="type" style={{ animationDelay: `${i * 350}ms` }} key={i}>
            {p}
          </p>
        ))}
      </section>

      <section>
        <h2 className="h-rule">FEATURED CAMPAIGNS</h2>
        <div className="debrief__featured">
          {debrief.featured.map((f) => (
            <article className="feat" key={f.label}>
              <header className="feat__head">
                <span className="feat__label">{f.label}</span>
                <Stamp tone={f.result.won ? 'olive' : 'red'} size="sm">
                  {f.result.won ? 'W' : 'L'}
                </Stamp>
              </header>
              <h3 className="feat__war">{f.result.game.kind.name}</h3>
              <p className="feat__enemy">
                {f.result.game.kind.subtitle} · {f.result.game.kind.era} · war{' '}
                {f.result.game.index + 1} of 50 · {marginLabel(f.result.margin)}
              </p>
              <p className="feat__body">{f.writeup}</p>
              {f.unitLine && <p className="feat__quote">“{f.unitLine}”</p>}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h-rule">DECORATIONS &amp; DISCIPLINE</h2>
        <div className="debrief__medals">
          <div className="medal">
            <p className="medal__label medal__label--good">★ MOST VALUABLE FORCE</p>
            <PickCard pick={debrief.mvp.pick} compact />
            <p className="medal__note">{debrief.mvp.note}</p>
          </div>
          <div className="medal">
            <p className="medal__label medal__label--bad">✖ COURT-MARTIALED</p>
            <PickCard pick={debrief.scapegoat.pick} compact />
            <p className="medal__note">{debrief.scapegoat.note}</p>
          </div>
        </div>
        <p className="debrief__era">{debrief.eraLine}</p>
      </section>

      <section>
        <h2 className="h-rule">FULL SEASON LEDGER</h2>
        <WLGrid results={season.results} size="md" />
        <p className="debrief__legend">
          <span className="wlcell wlcell--w wlcell--inline" /> victory ·{' '}
          <span className="wlcell wlcell--l wlcell--inline" /> defeat ·{' '}
          <span className="wlcell wlcell--boss wlcell--inline" /> boss fight — hover any square for
          the war
        </p>
      </section>

      <section>
        <h2 className="h-rule">SPREAD THE PROPAGANDA</h2>
        <div className="debrief__share">
          {cardUrl && (
            <img className="debrief__card" src={cardUrl} alt="Shareable season summary card" />
          )}
          <div className="debrief__sharebtns">
            <button className="btn btn--red" onClick={doCopy}>
              {copyState === 'ok' ? 'Copied to clipboard ✓' : 'Copy result text'}
            </button>
            {cardUrl && (
              <a
                className="btn btn--ink"
                href={cardUrl}
                download={`undefeated-${season.wins}-${season.losses}.png`}
              >
                Save the poster
              </a>
            )}
          </div>
          {copyState === 'fail' && (
            <textarea
              className="debrief__sharetext"
              readOnly
              rows={8}
              value={shareText(season, rank, dayNo)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Shareable result text — select and copy manually"
            />
          )}
        </div>
      </section>

      <footer className="debrief__foot">
        {dayNo ? (
          <p>New draft board at midnight. The timeline needs the rest.</p>
        ) : (
          <p>Another timeline is always available.</p>
        )}
        <p className="debrief__versions">
          RULESET v{RULESET_VERSION} · ROSTER v{ROSTER_VERSION} · SCENARIOS v{SCENARIO_VERSION}
        </p>
        <div className="debrief__footbtns">
          <button className="btn btn--ghost" onClick={onHome}>
            Back to HQ
          </button>
          <button className="btn btn--ink" onClick={onFree}>
            Free play — new timeline
          </button>
        </div>
      </footer>
    </div>
  )
}
