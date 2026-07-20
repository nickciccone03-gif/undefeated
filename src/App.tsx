import { useCallback, useEffect, useMemo, useState } from 'react'
import { Debrief } from './components/Debrief'
import { Draft } from './components/Draft'
import { Roster } from './components/Roster'
import { Season } from './components/Season'
import { Title } from './components/Title'
import { buildDraft, buildSeason, daySeedFrom, rankTeams, simulate } from './game/engine'
import { buildDebrief, type Debrief as DebriefData } from './game/narrate'
import { dayNumber, todayKey } from './game/rng'
import { ALL_PICKS } from './game/roster'
import { getDayRecord, getStats, setDayRecord } from './game/storage'
import { SLOT_ORDER, type DraftBoard, type Pick, type RankInfo, type SeasonResult, type SlotId } from './game/types'

type Phase = 'title' | 'draft' | 'roster' | 'season' | 'debrief'

interface Run {
  mode: 'daily' | 'free'
  daySeed: number
  dayNo: number | null
  board: DraftBoard
  picks: Partial<Record<SlotId, Pick>>
}

interface Outcome {
  season: SeasonResult
  rank: RankInfo
  debrief: DebriefData
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('title')
  const [run, setRun] = useState<Run | null>(null)
  const [activeSlot, setActiveSlot] = useState<SlotId>('commander')
  const [returnToRoster, setReturnToRoster] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [statsTick, setStatsTick] = useState(0)

  // Every screen (and each draft slot) reads top-down; snap the scroll back.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [phase, activeSlot])

  // statsTick invalidates after each recorded daily run; phase re-checks on navigation.
  const stats = useMemo(() => getStats(), [statsTick, phase])
  const playedToday = useMemo(() => getDayRecord(todayKey()), [statsTick, phase])

  const startDaily = useCallback(() => {
    const key = todayKey()
    const daySeed = daySeedFrom(key)
    const board = buildDraft(daySeed)
    const existing = getDayRecord(key)

    if (existing) {
      // Deterministic engine: rebuild the exact season from the stored picks.
      const picks = existing.picks
        .map((id) => ALL_PICKS.find((p) => p.id === id))
        .filter((p): p is Pick => Boolean(p))
      if (picks.length === SLOT_ORDER.length) {
        const games = buildSeason(daySeed)
        const season = simulate(picks, games, daySeed)
        const rank = rankTeams(board, games, season.wins)
        setRun({ mode: 'daily', daySeed, dayNo: dayNumber(), board, picks: byslot(picks) })
        setOutcome({ season, rank, debrief: buildDebrief(season, rank) })
        setPhase('debrief')
        return
      }
    }

    setRun({ mode: 'daily', daySeed, dayNo: dayNumber(), board, picks: {} })
    setActiveSlot('commander')
    setReturnToRoster(false)
    setOutcome(null)
    setPhase('draft')
  }, [])

  const startFree = useCallback(() => {
    const daySeed = (Math.random() * 0xffffffff) >>> 0
    setRun({ mode: 'free', daySeed, dayNo: null, board: buildDraft(daySeed), picks: {} })
    setActiveSlot('commander')
    setReturnToRoster(false)
    setOutcome(null)
    setPhase('draft')
  }, [])

  const onPick = useCallback(
    (slot: SlotId, pick: Pick) => {
      if (!run) return
      const picks = { ...run.picks, [slot]: pick }
      setRun({ ...run, picks })
      const nextEmpty = SLOT_ORDER.find((s) => !picks[s])
      if (returnToRoster || !nextEmpty) {
        setReturnToRoster(false)
        setPhase('roster')
      } else {
        setActiveSlot(nextEmpty)
      }
    },
    [run, returnToRoster],
  )

  const onSwap = useCallback((slot: SlotId) => {
    setActiveSlot(slot)
    setReturnToRoster(true)
    setPhase('draft')
  }, [])

  const declareWar = useCallback(() => {
    if (!run) return
    const team = SLOT_ORDER.map((s) => run.picks[s]).filter((p): p is Pick => Boolean(p))
    if (team.length !== SLOT_ORDER.length) return
    const games = buildSeason(run.daySeed)
    const season = simulate(team, games, run.daySeed)
    const rank = rankTeams(run.board, games, season.wins)
    setOutcome({ season, rank, debrief: buildDebrief(season, rank) })
    if (run.mode === 'daily') {
      setDayRecord(todayKey(), {
        picks: team.map((p) => p.id),
        wins: season.wins,
        losses: season.losses,
      })
      setStatsTick((t) => t + 1)
    }
    setPhase('season')
  }, [run])

  return (
    <div className="shell">
      {phase !== 'title' && (
        <button className="shell__home" onClick={() => setPhase('title')} title="Back to HQ">
          UNDEFEATED
        </button>
      )}

      {phase === 'title' && (
        <Title playedToday={playedToday} stats={stats} onDaily={startDaily} onFree={startFree} />
      )}

      {phase === 'draft' && run && (
        <Draft board={run.board} picks={run.picks} activeSlot={activeSlot} onPick={onPick} />
      )}

      {phase === 'roster' && run && allPicked(run.picks) && (
        <Roster picks={run.picks as Record<SlotId, Pick>} onSwap={onSwap} onDeclare={declareWar} />
      )}

      {phase === 'season' && outcome && (
        <Season season={outcome.season} onDone={() => setPhase('debrief')} />
      )}

      {phase === 'debrief' && outcome && run && (
        <Debrief
          season={outcome.season}
          rank={outcome.rank}
          debrief={outcome.debrief}
          dayNo={run.dayNo}
          onHome={() => setPhase('title')}
          onFree={startFree}
        />
      )}

      <footer className="shell__foot">
        <p>
          UNDEFEATED is a parody. All commanders are on loan from history and will be returned
          lightly used.
        </p>
      </footer>
    </div>
  )
}

function byslot(picks: Pick[]): Partial<Record<SlotId, Pick>> {
  const out: Partial<Record<SlotId, Pick>> = {}
  for (const p of picks) out[p.slot] = p
  return out
}

function allPicked(picks: Partial<Record<SlotId, Pick>>): boolean {
  return SLOT_ORDER.every((s) => picks[s])
}
