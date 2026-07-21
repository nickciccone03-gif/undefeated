import { useCallback, useEffect, useMemo, useState } from 'react'
import { Debrief } from './components/Debrief'
import { RequisitionDraft } from './components/Wheel'
import { Roster } from './components/Roster'
import { Season } from './components/Season'
import { Title } from './components/Title'
import {
  ACTIVE_CELLS,
  buildDaily,
  cellPicks,
  compatSummary,
  rankTeams,
  simulate,
  swapIsLegal,
} from './game/engine'
import { buildDebrief, type Debrief as DebriefData } from './game/narrate'
import { dayNumber, todayKey } from './game/rng'
import { ALL_PICKS } from './game/roster'
import {
  getDayRecord,
  getSettings,
  getStats,
  isCurrentVersion,
  setDayRecord,
  setSettings,
  type Settings,
} from './game/storage'
import {
  SLOT_ORDER,
  type EraId,
  type Game,
  type Pick,
  type RankInfo,
  type Requisition,
  type SeasonResult,
  type SlotId,
} from './game/types'

type Phase = 'title' | 'draft' | 'roster' | 'season' | 'debrief'

interface Run {
  mode: 'daily' | 'free'
  key: string
  daySeed: number
  dayNo: number | null
  orders: Requisition[]
  games: Game[]
  /** Era flips, keyed by ROUND INDEX — eras belong to rounds, and branch trades move chairs between rounds. */
  eraOverrides: Partial<Record<number, EraId>>
  /** Rounds that already spent their one Branch Override (paired branch trade). */
  branchUsed: Partial<Record<number, true>>
  /** Chairs that already spent their one Branch Transfer while being drafted. */
  transfersUsed: Partial<Record<SlotId, true>>
  roundIdx: number
  redoSlot: SlotId | null
  returnToRoster: boolean
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
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [settings, setSettingsState] = useState<Settings>(() => getSettings())
  const [statsTick, setStatsTick] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [phase, run?.roundIdx, run?.redoSlot])

  const stats = useMemo(() => getStats(), [statsTick, phase])
  const playedToday = useMemo(() => {
    const r = getDayRecord(todayKey())
    return r && isCurrentVersion(r) ? r : null
  }, [statsTick, phase])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState(setSettings(patch))
  }, [])

  const freshRun = (mode: 'daily' | 'free', key: string): Run => {
    const { daySeed, orders, games } = buildDaily(key)
    return {
      mode,
      key,
      daySeed,
      dayNo: mode === 'daily' ? dayNumber() : null,
      orders,
      games,
      eraOverrides: {},
      branchUsed: {},
      transfersUsed: {},
      roundIdx: 0,
      redoSlot: null,
      returnToRoster: false,
      picks: {},
    }
  }

  /** Command HQ plays the orders as dealt: base eras, no override, no transfer. */
  const baseCells = useCallback(
    (r: Run) =>
      SLOT_ORDER.map((slot) => {
        const o = r.orders.find((x) => x.slot === slot)!
        return cellPicks(o.era, slot)
      }),
    [],
  )

  const finish = useCallback(
    (r: Run, team: Pick[]) => {
      const season = simulate(team, r.games, r.daySeed)
      const rank = rankTeams(baseCells(r), r.games, season.wins)
      const debrief = buildDebrief(season, rank, compatSummary(team))
      setOutcome({ season, rank, debrief })
      if (r.mode === 'daily') {
        setDayRecord(r.key, {
          picks: team.map((p) => p.id),
          wins: season.wins,
          losses: season.losses,
        })
        setStatsTick((t) => t + 1)
      }
    },
    [baseCells],
  )

  const startDaily = useCallback(() => {
    const key = todayKey()
    const existing = getDayRecord(key)

    if (existing && isCurrentVersion(existing)) {
      // Deterministic replay from stored picks (same versions only — old-version
      // records are archived, never silently recomputed).
      const picks = existing.picks
        .map((id) => ALL_PICKS.find((p) => p.id === id))
        .filter((p): p is Pick => Boolean(p))
      if (picks.length === SLOT_ORDER.length) {
        const r = freshRun('daily', key)
        const bySlot: Partial<Record<SlotId, Pick>> = {}
        SLOT_ORDER.forEach((s, i) => (bySlot[s] = picks[i]))
        setRun({ ...r, picks: bySlot, roundIdx: r.orders.length })
        finish(r, picks)
        setPhase('debrief')
        return
      }
    }

    setRun(freshRun('daily', key))
    setOutcome(null)
    setPhase('draft')
  }, [finish])

  const startFree = useCallback(() => {
    setRun(freshRun('free', `free-${((Math.random() * 0xffffffff) >>> 0).toString(16)}`))
    setOutcome(null)
    setPhase('draft')
  }, [])

  // ---- draft-round machinery ----

  const currentOrder = useMemo(() => {
    if (!run) return null
    const idx = run.redoSlot
      ? run.orders.findIndex((o) => o.slot === run.redoSlot)
      : run.roundIdx
    const base = run.orders[idx]
    if (!base) return null
    return { ...base, era: run.eraOverrides[idx] ?? base.era, idx }
  }, [run])

  const advance = (r: Run, nextPicks: Partial<Record<SlotId, Pick>>): void => {
    const wasRedo = r.redoSlot !== null
    const nextIdx = wasRedo ? r.roundIdx : r.roundIdx + 1
    const complete = SLOT_ORDER.every((s) => nextPicks[s])
    const next: Run = {
      ...r,
      picks: nextPicks,
      redoSlot: null,
      roundIdx: wasRedo && !r.returnToRoster ? r.roundIdx + 1 : nextIdx,
      returnToRoster: false,
    }
    setRun(next)
    if (complete && (next.roundIdx >= next.orders.length || r.returnToRoster)) {
      setPhase('roster')
    }
  }

  const onDraft = useCallback(
    (pick: Pick) => {
      if (!run || !currentOrder) return
      advance(run, { ...run.picks, [currentOrder.slot]: pick })
    },
    [run, currentOrder],
  )

  /**
   * Era re-roll: one per round. The landing era is seeded into the day's
   * orders (altEra) — the same gamble for every player — and only revealed by
   * the reel. Unavailable if a branch re-roll moved a chair here whose active
   * eras don't include the seeded result.
   */
  const eraRerollAvailable = Boolean(
    run &&
      currentOrder &&
      !run.eraOverrides[currentOrder.idx] &&
      ACTIVE_CELLS[currentOrder.slot].includes(currentOrder.altEra),
  )

  const onRerollEra = useCallback(() => {
    if (!run || !currentOrder || !eraRerollAvailable) return
    setRun({
      ...run,
      eraOverrides: { ...run.eraOverrides, [currentOrder.idx]: currentOrder.altEra },
    })
  }, [run, currentOrder, eraRerollAvailable])

  /**
   * Branch re-roll: one per round. The landing branch is seeded into the
   * day's orders (altSlot); under the hood the two rounds trade chairs so the
   * army still fills all eight — the branch you leave comes back up later
   * under the partner round's era.
   */
  const branchTarget = useMemo(() => {
    if (!run || !currentOrder || run.redoSlot) return null
    const i = currentOrder.idx
    if (run.branchUsed[i]) return null
    const targetSlot = run.orders[i].altSlot
    if (targetSlot === run.orders[i].slot) return null
    const j = run.orders.findIndex((o) => o.slot === targetSlot)
    if (j < 0 || j === i || run.picks[targetSlot]) return null
    const eras = run.orders.map((o, k) => run.eraOverrides[k] ?? o.era)
    if (!swapIsLegal(run.orders, i, j, eras)) return null
    return { partnerIdx: j, slot: targetSlot }
  }, [run, currentOrder])

  const onRerollBranch = useCallback(() => {
    if (!run || !currentOrder || !branchTarget) return
    const i = currentOrder.idx
    const j = branchTarget.partnerIdx
    const orders = run.orders.map((o) => ({ ...o }))
    const traded = orders[i].slot
    orders[i].slot = orders[j].slot
    orders[j].slot = traded
    setRun({ ...run, orders, branchUsed: { ...run.branchUsed, [i]: true } })
  }, [run, currentOrder, branchTarget])

  const onTransfer = useCallback(
    (fromSlot: SlotId, pick: Pick) => {
      // One branch transfer per round: each chair may pull one drafted unit across once.
      if (!run || !currentOrder || run.transfersUsed[currentOrder.slot]) return
      const picks = { ...run.picks, [currentOrder.slot]: pick }
      delete picks[fromSlot]
      setRun({
        ...run,
        picks,
        transfersUsed: { ...run.transfersUsed, [currentOrder.slot]: true },
        redoSlot: fromSlot,
      })
    },
    [run, currentOrder],
  )

  const onSwap = useCallback(
    (slot: SlotId) => {
      if (!run) return
      const picks = { ...run.picks }
      delete picks[slot]
      setRun({ ...run, picks, redoSlot: slot, returnToRoster: true })
      setPhase('draft')
    },
    [run],
  )

  const declareWar = useCallback(() => {
    if (!run) return
    const team = SLOT_ORDER.map((s) => run.picks[s]).filter((p): p is Pick => Boolean(p))
    if (team.length !== SLOT_ORDER.length) return
    finish(run, team)
    setPhase('season')
  }, [run, finish])

  const usedIds = useMemo(
    () => new Set(Object.values(run?.picks ?? {}).map((p) => (p as Pick).id)),
    [run?.picks],
  )

  const filledCount = run ? SLOT_ORDER.filter((s) => run.picks[s]).length : 0

  return (
    <div className="shell">
      {phase !== 'title' && (
        <button className="shell__home" onClick={() => setPhase('title')} title="Back to HQ">
          UNDEFEATED
        </button>
      )}

      {phase === 'title' && (
        <Title
          playedToday={playedToday}
          stats={stats}
          settings={settings}
          onSettings={updateSettings}
          onDaily={startDaily}
          onFree={startFree}
        />
      )}

      {phase === 'draft' && run && currentOrder && (
        <RequisitionDraft
          order={currentOrder}
          roundNo={Math.min(filledCount + 1, run.orders.length)}
          totalRounds={run.orders.length}
          picks={run.picks}
          usedIds={usedIds}
          eraReroll={eraRerollAvailable}
          branchReroll={branchTarget !== null}
          transferUsed={Boolean(run.transfersUsed[currentOrder.slot])}
          isRedo={run.redoSlot !== null && !run.returnToRoster}
          settings={settings}
          onDraft={onDraft}
          onRerollEra={onRerollEra}
          onRerollBranch={onRerollBranch}
          onTransfer={onTransfer}
        />
      )}

      {phase === 'roster' && run && SLOT_ORDER.every((s) => run.picks[s]) && (
        <Roster
          picks={run.picks as Record<SlotId, Pick>}
          onSwap={onSwap}
          onDeclare={declareWar}
        />
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
          lightly used. Living leaders are rated satirically; the numbers argue back.
        </p>
      </footer>
    </div>
  )
}
