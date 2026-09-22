// Current battery ring — layout copied from reference, themed from tokens.
// Presentational only: latest energyScore 1-5 maps to 20/40/60/80/100%.
import { useEffect, useState } from 'react'
import { latestCheckin, statusFor } from './energyBattery.helpers.js'

const SIZE = 160
const CENTER = 80
const RADIUS = 64
const CIRC = 2 * Math.PI * RADIUS
const GAP_DEG = 32
const GAP_LEN = (GAP_DEG / 360) * CIRC
const TRACK_LEN = CIRC - GAP_LEN
// Rotate so the gap sits centered at the bottom (SVG 0deg = 3 o'clock).
const ROTATE = 90 + GAP_DEG / 2

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="battery-ring__bolt">
      <path
        d="M13 2 5.5 13.5H11L9.5 22 18 10h-5.5L13 2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function EnergyBattery({ checkins }) {
  const latest = latestCheckin(checkins)
  const [animated, setAnimated] = useState(0)

  const energy = latest ? Math.min(5, Math.max(1, Number(latest.energyScore) || 1)) : 0
  const percent = latest ? energy * 20 : 0
  const status = latest ? statusFor(energy) : null

  useEffect(() => {
    if (!latest) {
      setAnimated(0)
      return undefined
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setAnimated(percent)
      return undefined
    }
    setAnimated(0)
    const frame = requestAnimationFrame(() => setAnimated(percent))
    return () => cancelAnimationFrame(frame)
  }, [latest, percent])

  const fillLen = (animated / 100) * TRACK_LEN
  const fillDash = `${fillLen} ${CIRC - fillLen}`

  return (
    <div className="battery-ring__wrap">
      <div className="battery-ring">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={latest ? `Current energy ${percent} percent` : 'No energy reading yet'}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#EAEAEA"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${TRACK_LEN} ${GAP_LEN}`}
            transform={`rotate(${ROTATE} ${CENTER} ${CENTER})`}
          />
          {latest && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={status.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={fillDash}
              transform={`rotate(${ROTATE} ${CENTER} ${CENTER})`}
              className="battery-ring__fill"
            />
          )}
          <text
            x={CENTER}
            y={CENTER + 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="30"
            fontWeight="600"
            fill="#111111"
            fontFamily="var(--font-sans)"
            letterSpacing="-0.02em"
          >
            {latest ? `${percent}%` : '—'}
          </text>
        </svg>
        <span className="battery-ring__bolt-slot" aria-hidden="true">
          <BoltIcon />
        </span>
      </div>
      {status && (
        <p className="battery-ring__status">
          <span className={status.className}>{status.label}</span>
        </p>
      )}
      <table className="visually-hidden">
        <caption>Current energy reading</caption>
        <tbody>
          <tr>
            <th scope="row">Energy</th>
            <td>{latest ? `${percent} percent` : 'No reading'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
