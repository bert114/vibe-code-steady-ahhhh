// Renders deterministic signals as supportive observations — never
// diagnoses, never commands, never labels about other people.
import { signalText } from '../../../lib/ui/signalText.js'

function signalTag(type) {
  switch (type) {
    case 'low_energy_streak':
      return { label: 'Energy', className: 'tag tag--blue' }
    case 'high_drain_repeat':
      return { label: 'Drain', className: 'tag tag--red' }
    case 'repeated_emotions':
      return { label: 'Pattern', className: 'tag tag--yellow' }
    case 'repeated_draining_context':
      return { label: 'Context', className: 'tag tag--green' }
    default:
      return { label: 'Noticing', className: 'tag tag--neutral' }
  }
}

export default function SignalsPanel({ signals, concise = false }) {
  const shown = (signals ?? [])
    .map((signal) => ({ ...signal, text: signalText(signal, concise) }))
    .filter((signal) => signal.text)

  return (
    <section aria-labelledby="signals-heading">
      <h2 id="signals-heading">Noticing lately</h2>
      {shown.length === 0 ? (
        <p>No patterns standing out right now. Keep checking in and we&apos;ll keep an eye out.</p>
      ) : (
        <ul className="signal-list">
          {shown.map((s, i) => {
            const tag = signalTag(s.type)
            return (
              <li
                key={`${s.type}-${i}`}
                className="signal-item"
              >
                <span className={tag.className}>{tag.label}</span>
                <span>{s.text}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
