// Renders deterministic signals as supportive observations — never
// diagnoses, never commands, never labels about other people.
function signalText(signal, concise = false) {
  const e = signal.evidence ?? {}
  switch (signal.type) {
    case 'low_energy_streak':
      if (concise) return `Low energy in ${e.lowEnergyCount} of your last ${e.checkins} check-ins.`
      return `Low energy showed up in ${e.lowEnergyCount} of your last ${e.checkins} check-ins. Rest might be worth protecting.`
    case 'high_drain_repeat':
      if (concise) return `High drain in ${e.highDrainCount} of your last ${e.checkins} check-ins.`
      return `High drain showed up in ${e.highDrainCount} of your last ${e.checkins} check-ins. Notice what those moments have in common.`
    case 'repeated_emotions':
      if (concise) return `Repeated feelings: ${(e.repeated ?? []).map((r) => r.tag).join(', ')}.`
      return `These feelings keep coming up: ${(e.repeated ?? []).map((r) => r.tag).join(', ')}. There may be a pattern worth a closer look.`
    case 'repeated_draining_context':
      if (concise) return `"${e.context}" felt draining ${e.highDrainCount} times.`
      return `Time around "${e.context}" has felt draining ${e.highDrainCount} times lately. You get to decide what that means for you.`
    default:
      return null
  }
}

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
