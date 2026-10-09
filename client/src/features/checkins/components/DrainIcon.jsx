// Droplet filling with drain weight (1 = light … 5 = overwhelming).
// Pure presentational: currentColor outline, fill level tracks the score,
// always aria-hidden — the parent label's caption text stays the name.
import { useId } from 'react'

const DROP = 'M16 4 C16 4 8 14.5 8 20 a8 8 0 0 0 16 0 C24 14.5 16 4 16 4 Z'
const FILL_TOP = 26
const FILL_RANGE = 15

export default function DrainIcon({ score }) {
  const s = Math.min(5, Math.max(1, Number(score) || 3))
  const clipId = useId()
  const fillY = FILL_TOP - (s / 5) * FILL_RANGE
  return (
    <svg
      viewBox="0 0 32 32"
      className="score-option__icon"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <clipPath id={clipId}>
        <path d={DROP} />
      </clipPath>
      <rect x="4" y={fillY} width="24" height="28" fill="currentColor" stroke="none" clipPath={`url(#${clipId})`} opacity="0.85" />
      <path d={DROP} />
    </svg>
  )
}
