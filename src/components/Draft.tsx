import { ClassBar, PickCard } from './bits'
import { SLOT_LABELS, SLOT_ORDER, type DraftBoard, type Pick, type SlotId } from '../game/types'

export function Draft({
  board,
  picks,
  activeSlot,
  onPick,
}: {
  board: DraftBoard
  picks: Partial<Record<SlotId, Pick>>
  activeSlot: SlotId
  onPick: (slot: SlotId, pick: Pick) => void
}) {
  const slotIdx = SLOT_ORDER.indexOf(activeSlot)

  return (
    <div className="draft">
      <ClassBar>
        WAR DRAFT IN PROGRESS · SLOT {slotIdx + 1} OF {SLOT_ORDER.length}
      </ClassBar>

      <header className="draft__head">
        <p className="draft__kicker">NOW DRAFTING</p>
        <h2 className="draft__slot">{SLOT_LABELS[activeSlot]}</h2>
        <div className="draft__dots" aria-hidden="true">
          {SLOT_ORDER.map((s, i) => (
            <i
              key={s}
              className={`dot ${picks[s] ? 'dot--done' : ''} ${i === slotIdx ? 'dot--now' : ''}`}
            />
          ))}
        </div>
      </header>

      <div className="draft__options">
        {board.options[activeSlot].map((p, i) => (
          <div className="draft__option" style={{ animationDelay: `${i * 90}ms` }} key={p.id}>
            <PickCard pick={p} onPick={() => onPick(activeSlot, p)} />
          </div>
        ))}
      </div>

      {slotIdx > 0 && (
        <div className="draft__tray">
          <p className="draft__trayLabel">YOUR ARMY SO FAR</p>
          <div className="draft__trayChips">
            {SLOT_ORDER.filter((s) => picks[s]).map((s) => (
              <span key={s} className="chip chip--ink" title={SLOT_LABELS[s]}>
                {picks[s]!.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
