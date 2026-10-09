// Pure presentational trend visual — props only, no fetching, no store.
// Generalizes the dashboard's RhythmChart for a longer, day-bucketed window:
// mood/energy as lines, high-drain days marked, dots only shown when there
// are few enough points to stay legible.
const WIDTH = 640
const HEIGHT = 200
const PAD_LEFT = 24
const PAD_RIGHT = 12
const PAD_TOP = 12
const PAD_BOTTOM = 24
const DOT_THRESHOLD = 21 // above this many points, draw lines only

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

function shortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function TrendChart({ days }) {
  const ordered = days ?? []

  if (ordered.length < 2) {
    return (
      <p className="trend-chart__empty">
        Not enough check-ins in this window yet — record a few more and a trend will take shape here.
      </p>
    )
  }

  const showDots = ordered.length <= DOT_THRESHOLD
  const mood = ordered.map((d, i) => ({ x: toX(i, ordered.length), y: toY(d.avgMood) }))
  const energy = ordered.map((d, i) => ({ x: toX(i, ordered.length), y: toY(d.avgEnergy) }))
  const highDrainDots = ordered
    .map((d, i) => ({ x: toX(i, ordered.length), y: toY(d.avgDrain), date: d.date, high: d.avgDrain >= 4 }))
    .filter((p) => p.high)

  const first = ordered[0]
  const last = ordered[ordered.length - 1]

  return (
    <figure className="trend-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Mood and energy trend across ${ordered.length} days, from ${shortDate(first.date)} to ${shortDate(last.date)}`}
      >
        {[1, 2, 3, 4, 5].map((level) => (
          <line
            key={level}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={toY(level)}
            y2={toY(level)}
            stroke="var(--border-muted)"
            strokeWidth="1"
          />
        ))}
        <text x={2} y={toY(5) + 3} fontSize="9" fill="var(--text-muted)" fontFamily="ui-monospace, SFMono-Regular, Consolas, monospace">
          5
        </text>
        <text x={2} y={toY(1) + 3} fontSize="9" fill="var(--text-muted)" fontFamily="ui-monospace, SFMono-Regular, Consolas, monospace">
          1
        </text>
        <path d={seriesPath(energy)} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={seriesPath(mood)} fill="none" stroke="var(--text)" strokeWidth="2" />
        {showDots &&
          energy.map((p, i) => (
            <circle key={`e-${ordered[i].date}`} cx={p.x} cy={p.y} r="2.5" fill="var(--text-muted)" />
          ))}
        {showDots &&
          mood.map((p, i) => (
            <circle key={`m-${ordered[i].date}`} cx={p.x} cy={p.y} r="3" fill="var(--text)" />
          ))}
        {highDrainDots.map((p) => (
          <circle
            key={`d-${p.date}`}
            cx={p.x}
            cy={p.y - 10}
            r="3"
            fill="var(--danger)"
            data-high-drain="true"
          />
        ))}
        <text x={PAD_LEFT} y={HEIGHT - 6} fontSize="9" fill="var(--text-muted)">
          {shortDate(first.date)}
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 6} fontSize="9" textAnchor="end" fill="var(--text-muted)">
          {shortDate(last.date)}
        </text>
      </svg>
      <figcaption className="trend-chart__legend">
        <span className="tag tag--neutral">Mood</span>
        <span className="tag tag--neutral">Energy</span>
        <span className="tag tag--red">High drain day</span>
      </figcaption>
      <table className="visually-hidden">
        <caption>Daily mood, energy and drain averages</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Mood</th>
            <th scope="col">Energy</th>
            <th scope="col">Drain</th>
            <th scope="col">Check-ins</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((d) => (
            <tr key={d.date}>
              <td>{shortDate(d.date)}</td>
              <td>{d.avgMood}</td>
              <td>{d.avgEnergy}</td>
              <td>{d.avgDrain}</td>
              <td>{d.checkins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
