// Battery level per energy score (1 = running on empty … 5 = full tank).
// Pure presentational: currentColor strokes, fill level tracks the score,
// always aria-hidden — the parent label's caption text stays the name.
const INNER_X = 7
const INNER_Y = 13
const INNER_H = 6
const INNER_MAX_W = 16

export default function EnergyIcon({ score }) {
  const s = Math.min(5, Math.max(1, Number(score) || 3))
  const fillW = Math.max(2, (s / 5) * INNER_MAX_W)
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
      <rect x="4" y="10" width="22" height="12" rx="3" />
      <rect x="27" y="14" width="2.5" height="4" rx="1" fill="currentColor" stroke="none" />
      <rect
        x={INNER_X}
        y={INNER_Y}
        width={fillW}
        height={INNER_H}
        rx="1.5"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}
