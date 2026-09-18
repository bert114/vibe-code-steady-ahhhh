// Renders deterministic signals as supportive observations — never
// diagnoses, never commands, never labels about other people.
function signalText(signal) {
  const e = signal.evidence ?? {}
  switch (signal.type) {
    case 'low_energy_streak':
      return `Low energy showed up in ${e.lowEnergyCount} of your last ${e.checkins} check-ins. Rest might be worth protecting.`
    case 'high_drain_repeat':
      return `High drain showed up in ${e.highDrainCount} of your last ${e.checkins} check-ins. Notice what those moments have in common.`
    case 'repeated_emotions':
      return `These feelings keep coming up: ${(e.repeated ?? []).map((r) => r.tag).join(', ')}. There may be a pattern worth a closer look.`
    case 'repeated_draining_context':
      return `Time around "${e.context}" has felt draining ${e.highDrainCount} times lately. You get to decide what that means for you.`
    default:
      return null
  }
}

export default function SignalsPanel({ signals }) {
  const shown = (signals ?? []).map((s) => ({ ...s, text: signalText(s) })).filter((s) => s.text)

  return (
    <section aria-labelledby="signals-heading">
      <h2 id="signals-heading">Noticing lately</h2>
      {shown.length === 0 ? (
        <p>No patterns standing out right now. Keep checking in and we&apos;ll keep an eye out.</p>
      ) : (
        <ul>
          {shown.map((s, i) => (
            <li key={`${s.type}-${i}`}>{s.text}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
