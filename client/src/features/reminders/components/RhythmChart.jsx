// Pure presentational trend visual for the dashboard.
// No fetching, no store, no business rules — props only.
const WIDTH = 320
const HEIGHT = 120
const PAD_LEFT = 18
const PAD_RIGHT = 10
const PAD_TOP = 10
const PAD_BOTTOM = 18

function toY(score) {
  const clamped = Math.min(5, Math.max(1, Number(score) || 1))
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM
  return PAD_TOP + (1 - (clamped - 1) / 4) * plotH
}

function toX(index, count) {
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT
  if (count <= 1) return PAD_LEFT + plotW / 2
  return PAD_LEFT + (index / (count - 1)) * plotW
}

function seriesPath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

export default function RhythmChart({ checkins }) {
  const ordered = [...(checkins ?? [])]
    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
    .slice(-5)

  if (ordered.length < 2) {
    return (
      <p className="rhythm-chart__empty">
        Record a couple more check-ins and your rhythm will take shape here.
      </p>
    )
  }

  const mood = ordered.map((c, i) => ({ x: toX(i, ordered.length), y: toY(c.moodScore) }))
  const energy = ordered.map((c, i) => ({ x: toX(i, ordered.length), y: toY(c.energyScore) }))
  const drain = ordered.map((c, i) => ({
    x: toX(i, ordered.length),
    y: toY(c.drainScore),
    high: Number(c.drainScore) >= 4,
    id: c.id,
  }))

  return (
    <figure className="rhythm-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Mood, energy and drain over last ${ordered.length} check-ins`}
      >
        {[1, 2, 3, 4, 5].map((level) => (
          <line
            key={level}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={toY(level)}
            y2={toY(level)}
            stroke="#EAEAEA"
            strokeWidth="1"
          />
        ))}
        <text x={2} y={toY(5) + 3} fontSize="8" fill="#787774" fontFamily="var(--font-mono)">
          5
        </text>
        <text x={2} y={toY(1) + 3} fontSize="8" fill="#787774" fontFamily="var(--font-mono)">
          1
        </text>
        <path d={seriesPath(energy)} fill="none" stroke="#787774" strokeWidth="1.25" strokeDasharray="4 3" />
        <path d={seriesPath(mood)} fill="none" stroke="#111111" strokeWidth="1.5" />
        {energy.map((p, i) => (
          <circle key={`e-${ordered[i].id}`} cx={p.x} cy={p.y} r="2.5" fill="#787774" />
        ))}
        {mood.map((p, i) => (
          <circle key={`m-${ordered[i].id}`} cx={p.x} cy={p.y} r="3" fill="#111111" />
        ))}
        {drain.map((p) => (
          <circle
            key={`d-${p.id}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={p.high ? '#9F2F2D' : 'transparent'}
            stroke={p.high ? '#FDEBEC' : '#787774'}
            strokeWidth={p.high ? 3 : 1.25}
            data-high-drain={p.high ? 'true' : 'false'}
          />
        ))}
      </svg>
      <figcaption className="rhythm-chart__legend">
        <span className="tag tag--neutral">Mood</span>
        <span className="tag tag--neutral">Energy</span>
        <span className="tag tag--red">High drain</span>
      </figcaption>
      <table className="visually-hidden">
        <caption>Recent check-in scores</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Mood</th>
            <th scope="col">Energy</th>
            <th scope="col">Drain</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((c) => (
            <tr key={c.id}>
              <td>{new Date(c.occurredAt).toLocaleDateString()}</td>
              <td>{c.moodScore}</td>
              <td>{c.energyScore}</td>
              <td>{c.drainScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
