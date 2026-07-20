import { ClassBar } from './bits'
import { yearLabel } from '../game/roster'
import { SLOT_LABELS, SLOT_ORDER, type Pick, type SlotId } from '../game/types'

function spanJoke(span: number): string {
  if (span >= 30) return 'HR has flagged the culture gap as “a war crime against payroll.”'
  if (span >= 20) return 'Your quartermaster must supply crossbows and jet fuel from the same tent.'
  if (span >= 10) return 'Briefings require two translators and one exorcist.'
  if (span >= 4) return 'Manageable anachronism. Merely one museum of difference.'
  return 'A tight, era-coherent force. Historians are almost disappointed.'
}

export function Roster({
  picks,
  onSwap,
  onDeclare,
}: {
  picks: Record<SlotId, Pick>
  onSwap: (slot: SlotId) => void
  onDeclare: () => void
}) {
  const team = SLOT_ORDER.map((s) => picks[s])
  const years = team.map((p) => p.year)
  const span = Math.max(1, Math.round((Math.max(...years) - Math.min(...years)) / 100))

  return (
    <div className="roster">
      <ClassBar>ORDER OF BATTLE · FINAL REVIEW</ClassBar>

      <h2 className="roster__title">YOUR ARMY</h2>
      <p className="roster__span">
        Timeline span: <strong>{span} centuries.</strong> {spanJoke(span)}
      </p>

      <ul className="roster__list">
        {SLOT_ORDER.map((slot) => {
          const p = picks[slot]
          return (
            <li key={slot} className="roster__row">
              <span className="roster__slot">{SLOT_LABELS[slot]}</span>
              <span className="roster__pick">
                <strong>{p.name}</strong>
                <em>
                  {p.origin} · {yearLabel(p.year)}
                </em>
              </span>
              <button className="btn btn--ghost btn--sm" onClick={() => onSwap(slot)}>
                Swap
              </button>
            </li>
          )
        })}
      </ul>

      <button className="btn btn--red btn--big roster__go" onClick={onDeclare}>
        ⚔ Declare war on history
      </button>
      <p className="roster__fine">
        50 wars, in chronological order, Thermopylae to the Gulf. No preseason. No mercy.
      </p>
    </div>
  )
}
