import { useEffect, useMemo, useState } from 'react'
import { ClassBar, PickCard } from './bits'
import { cellPicks } from '../game/engine'
import type { Settings } from '../game/storage'
import { yearLabel } from '../game/roster'
import {
  ERA_HINTS,
  ERA_LABELS,
  ERA_ORDER,
  SLOT_LABELS,
  SLOT_ORDER,
  SLOT_SHORT,
  STAT_KEYS,
  STAT_LABELS,
  eraOf,
  type EraId,
  type Pick,
  type Requisition,
  type SlotId,
  type StatKey,
} from '../game/types'

const STAT_SHORT: Record<StatKey, string> = {
  atk: 'FIRE',
  def: 'DEF',
  mob: 'MOB',
  log: 'LOG',
  tech: 'TECH',
  grit: 'MRLE',
  int: 'INTL',
}

function strengthsOf(p: Pick): { top: StatKey[]; low: StatKey } {
  const sorted = [...STAT_KEYS].sort((a, b) => p.stats[b] - p.stats[a])
  return { top: sorted.slice(0, 2), low: sorted[sorted.length - 1] }
}

type SortKey = 'year' | 'name' | StatKey

export function RequisitionDraft({
  order,
  roundNo,
  totalRounds,
  picks,
  usedIds,
  eraReroll,
  branchReroll,
  transferUsed,
  isRedo,
  settings,
  onDraft,
  onRerollEra,
  onRerollBranch,
  onTransfer,
}: {
  order: Requisition & { era: EraId }
  roundNo: number
  totalRounds: number
  picks: Partial<Record<SlotId, Pick>>
  usedIds: Set<string>
  /** This round's era re-roll is still available. */
  eraReroll: boolean
  /** This round's branch re-roll is still available. */
  branchReroll: boolean
  transferUsed: boolean
  isRedo: boolean
  settings: Settings
  onDraft: (pick: Pick) => void
  onRerollEra: () => void
  onRerollBranch: () => void
  onTransfer: (fromSlot: SlotId, pick: Pick) => void
}) {
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [spinning, setSpinning] = useState(!reduced)
  const [reelEra, setReelEra] = useState<string>(ERA_LABELS[order.era])
  const [reelSlot, setReelSlot] = useState<string>(SLOT_LABELS[order.slot])
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('year')
  const [expanded, setExpanded] = useState<string | null>(null)

  // Spin the reels whenever the order identity changes (new round or override).
  useEffect(() => {
    setQuery('')
    setExpanded(null)
    setSortKey('year')
    if (reduced) {
      setSpinning(false)
      return
    }
    setSpinning(true)
    let tick = 0
    const iv = setInterval(() => {
      tick++
      setReelEra(ERA_LABELS[ERA_ORDER[Math.floor(Math.random() * ERA_ORDER.length)]])
      setReelSlot(SLOT_LABELS[SLOT_ORDER[Math.floor(Math.random() * SLOT_ORDER.length)]])
      if (tick >= 12) {
        clearInterval(iv)
        setReelEra(ERA_LABELS[order.era])
        setReelSlot(SLOT_LABELS[order.slot])
        setTimeout(() => setSpinning(false), 350)
      }
    }, 85)
    return () => clearInterval(iv)
  }, [order.slot, order.era, reduced])

  const pool = useMemo(() => {
    const base = cellPicks(order.era, order.slot).filter((p) => !usedIds.has(p.id))
    if (!settings.excludeLeaders) return base
    const core = base.filter((p) => p.ruleset !== 'current-affairs')
    // A cell that is politicians all the way down must still be draftable.
    return core.length > 0 ? core : base
  }, [order.era, order.slot, usedIds, settings.excludeLeaders])

  const leadersForced =
    settings.excludeLeaders && pool.some((p) => p.ruleset === 'current-affairs')

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = pool
    if (q) list = list.filter((p) => `${p.name} ${p.origin}`.toLowerCase().includes(q))
    const sorted = [...list]
    if (sortKey === 'year') sorted.sort((a, b) => a.year - b.year)
    else if (sortKey === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else sorted.sort((a, b) => b.stats[sortKey] - a.stats[sortKey])
    return sorted
  }, [pool, query, sortKey])

  const transferables = useMemo(
    () =>
      (Object.entries(picks) as [SlotId, Pick][])
        .filter(
          ([s, p]) =>
            s !== order.slot && (p.slot === order.slot || p.altSlot === order.slot),
        )
        .map(([s, p]) => ({ from: s, pick: p })),
    [picks, order.slot],
  )

  return (
    <div className="draft">
      <ClassBar>
        REQUISITION ORDER {roundNo} OF {totalRounds}
        {isRedo ? ' · RE-DRAFT (BRANCH TRANSFER)' : ''}
      </ClassBar>

      <div className={`wheel ${spinning ? 'wheel--spinning' : ''}`}>
        <div className="wheel__reel">
          <span className="wheel__label">ERA</span>
          <span className="wheel__value">{reelEra}</span>
          {!spinning && <span className="wheel__hint">{ERA_HINTS[order.era]}</span>}
        </div>
        <span className="wheel__x">×</span>
        <div className="wheel__reel">
          <span className="wheel__label">BRANCH</span>
          <span className="wheel__value">{reelSlot}</span>
          {!spinning && <span className="wheel__hint">the {SLOT_SHORT[order.slot]} chair</span>}
        </div>
      </div>

      {!spinning && (
        <>
          <div className="wheel__actions">
            {eraReroll && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={onRerollEra}
                title="Spin the era again — this round only. You keep what you land on. One era re-roll per round."
              >
                ↻ Re-roll Era (1 per round)
              </button>
            )}
            {branchReroll && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={onRerollBranch}
                title="Spin the branch again — this round only. The branch you leave behind comes back up in a later round. One branch re-roll per round."
              >
                ↻ Re-roll Branch (1 per round)
              </button>
            )}
            {!transferUsed &&
              transferables.map(({ from, pick }) => (
                <button
                  key={pick.id}
                  className="btn btn--ghost btn--sm"
                  onClick={() => onTransfer(from, pick)}
                  title={`Move ${pick.name} out of ${SLOT_LABELS[from]} into this chair, then re-draft ${SLOT_LABELS[from]}. One branch transfer per round.`}
                >
                  Branch Transfer: {pick.name} ({SLOT_SHORT[from]} → {SLOT_SHORT[order.slot]}) (1 per round)
                </button>
              ))}
          </div>

          {order.slot === 'logistics' && !settings.hideStats && (
            <p className="wheel__note">
              SUSTAINMENT NOTE: supply runs on TECH — this pick must maintain your most
              advanced equipment, not just feed the troops.
            </p>
          )}

          {leadersForced && (
            <p className="wheel__note">
              ROSTER POLICY WAIVED: this cell is politicians all the way down. Your
              exclusion request is noted, filed, and unfulfillable.
            </p>
          )}

          <div className="browse">
            <div className="browse__controls">
              <input
                className="browse__search"
                type="search"
                placeholder={`Search ${pool.length} eligible…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search eligible picks"
              />
              <select
                className="browse__sort"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-label="Sort picks"
              >
                <option value="year">Sort: Year</option>
                <option value="name">Sort: Name</option>
                {!settings.hideStats &&
                  STAT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      Sort: {STAT_SHORT[k]}
                    </option>
                  ))}
              </select>
            </div>

            <ul className="browse__list">
              {shown.map((p) => {
                const { top, low } = strengthsOf(p)
                const isOpen = expanded === p.id
                return (
                  <li key={p.id} className={`row ${isOpen ? 'row--open' : ''}`}>
                    <button
                      className="row__main"
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="row__name">{p.name}</span>
                      <span className="row__meta">
                        {p.origin} · {yearLabel(p.year)}
                        {p.altSlot && ` · ${SLOT_SHORT[p.slot]}/${SLOT_SHORT[p.altSlot]}`}
                      </span>
                      {!settings.hideStats && (
                        <span className="row__chips">
                          {p.slot === 'commander' && (
                            <>
                              <i className="chip chip--cmd" title="Leadership — multiplies the whole army">
                                LEAD {p.leadership ?? 5}
                              </i>
                              <i className="chip chip--cmd" title="Adaptability — staff work that bridges era gaps (C2)">
                                ADPT {p.adaptability ?? 5}
                              </i>
                            </>
                          )}
                          {STAT_KEYS.map((k) => (
                            <i
                              key={k}
                              className={`row__stat ${
                                top.includes(k) ? 'row__stat--hi' : k === low ? 'row__stat--lo' : ''
                              }`}
                              title={`${STAT_LABELS[k]}: ${p.stats[k]}/10`}
                            >
                              {STAT_SHORT[k]} {p.stats[k]}
                            </i>
                          ))}
                        </span>
                      )}
                    </button>
                    <button className="btn btn--ink btn--sm row__draft" onClick={() => onDraft(p)}>
                      Draft
                    </button>
                    {isOpen && (
                      <div className="row__card">
                        <PickCard pick={p} compact={settings.hideStats} />
                      </div>
                    )}
                  </li>
                )
              })}
              {shown.length === 0 && (
                <li className="browse__empty">
                  RECORD SEALED UNDER ROSTER POLICY — or your search outran the archive. Clear it
                  and try again.
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      <div className="draft__tray">
        <p className="draft__trayLabel">YOUR ARMY SO FAR</p>
        <div className="draft__trayChips">
          {SLOT_ORDER.filter((s) => picks[s]).map((s) => (
            <span key={s} className="chip chip--ink" title={SLOT_LABELS[s]}>
              {SLOT_SHORT[s]} · {picks[s]!.name} · {ERA_LABELS[eraOf(picks[s]!.year)]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
