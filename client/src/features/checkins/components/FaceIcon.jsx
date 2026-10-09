// Minimal stroked face per score (1 = distressed … 5 = great).
// Pure presentational: currentColor strokes, no fill, always aria-hidden —
// the parent label's caption text stays the accessible name.
const MOUTHS = {
  1: 'M9 17 Q16 11 23 17',
  2: 'M10 16.5 Q16 13 22 16.5',
  3: 'M10 16 H22',
  4: 'M10 14.5 Q16 19 22 14.5',
  5: 'M9 14 Q16 20.5 23 14',
}

const BROWS = {
  1: (
    <>
      <path d="M8.5 9.5 12.5 11" />
      <path d="M23.5 9.5 19.5 11" />
    </>
  ),
}

function Eyes({ score }) {
  if (score === 5) {
    return (
      <>
        <path d="M9.5 12 Q11.5 10 13.5 12" />
        <path d="M18.5 12 Q20.5 10 22.5 12" />
      </>
    )
  }
  return (
    <>
      <circle cx="11.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  )
}

export default function FaceIcon({ score }) {
  const s = Math.min(5, Math.max(1, Number(score) || 3))
  return (
    <svg
      viewBox="0 0 32 32"
      className="score-option__face"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="16" r="12.5" />
      {BROWS[s] ?? null}
      <Eyes score={s} />
      <path d={MOUTHS[s]} />
    </svg>
  )
}
