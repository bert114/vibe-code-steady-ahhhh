// Deterministic signal wording: supportive observations, never diagnoses.
export function signalText(signal, concise = false) {
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
