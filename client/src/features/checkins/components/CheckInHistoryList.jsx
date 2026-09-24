import { useState } from 'react'

function scoreLabel(type, val) {
  const num = Number(val)
  if (type === 'mood') {
    if (num <= 1) return { text: 'Rough', cls: 'badge--mood-rough' }
    if (num <= 3) return { text: 'Okay', cls: 'badge--mood-okay' }
    return { text: 'Great', cls: 'badge--mood-great' }
  }
  if (type === 'energy') {
    if (num <= 1) return { text: 'Empty', cls: 'badge--energy-low' }
    if (num <= 3) return { text: 'Steady', cls: 'badge--energy-mid' }
    return { text: 'Full', cls: 'badge--energy-high' }
  }
  if (type === 'drain') {
    if (num <= 1) return { text: 'Light', cls: 'badge--drain-light' }
    if (num <= 3) return { text: 'Moderate', cls: 'badge--drain-mid' }
    return { text: 'Heavy', cls: 'badge--drain-heavy' }
  }
  return { text: String(val), cls: '' }
}

function HistoryCard({ checkin, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const mood = scoreLabel('mood', checkin.moodScore)
  const energy = scoreLabel('energy', checkin.energyScore)
  const drain = scoreLabel('drain', checkin.drainScore)

  const dateStr = new Date(checkin.occurredAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = new Date(checkin.occurredAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(checkin.id)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <article className="history-card">
      <header className="history-card__header">
        <div className="history-card__meta">
          <time className="history-card__date" dateTime={checkin.occurredAt}>
            {dateStr}
          </time>
          <span className="history-card__time">{timeStr}</span>
        </div>
        <div className="history-card__actions">
          {!confirming ? (
            <button
              type="button"
              className="btn-ghost btn-sm history-card__delete-btn"
              onClick={() => setConfirming(true)}
              aria-label={`Delete check-in from ${dateStr} ${timeStr}`}
            >
              Delete
            </button>
          ) : (
            <div className="history-card__confirm-group" role="alert">
              <span className="history-card__confirm-prompt">Delete?</span>
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes'}
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="history-card__scores">
        <span className={`badge ${mood.cls}`}>Mood: {mood.text}</span>
        <span className={`badge ${energy.cls}`}>Energy: {energy.text}</span>
        <span className={`badge ${drain.cls}`}>Drain: {drain.text}</span>
      </div>

      {((checkin.emotions && checkin.emotions.length > 0) ||
        (checkin.contextTags && checkin.contextTags.length > 0)) && (
        <div className="history-card__tags">
          {checkin.emotions?.map((e, idx) => (
            <span key={`emo-${idx}`} className="chip chip--emotion">
              {e}
            </span>
          ))}
          {checkin.contextTags?.map((tag, idx) => (
            <span key={`tag-${idx}`} className="chip chip--context">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {checkin.note && (
        <div className="history-card__note-section">
          {expanded ? (
            <p className="history-card__note">{checkin.note}</p>
          ) : (
            <p className="history-card__note-preview">
              {checkin.note.length > 120
                ? `${checkin.note.slice(0, 120)}…`
                : checkin.note}
            </p>
          )}
          {checkin.note.length > 120 && (
            <button
              type="button"
              className="btn-link history-card__expand-btn"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? 'Show less' : 'Read full note'}
            </button>
          )}
        </div>
      )}
    </article>
  )
}

export default function CheckInHistoryList({ checkins = [], onDelete }) {
  if (!checkins || checkins.length === 0) {
    return (
      <div className="checkin-history__empty-card">
        <p className="checkin-history__empty-title">No check-ins yet</p>
        <p className="checkin-history__empty-desc">
          Take a moment to record your first check-in above. Over time, your entries help uncover patterns in your daily energy and boundaries.
        </p>
      </div>
    )
  }

  return (
    <div className="checkin-history__timeline" role="feed" aria-label="Previous check-ins">
      {checkins.map((checkin) => (
        <HistoryCard key={checkin.id} checkin={checkin} onDelete={onDelete} />
      ))}
    </div>
  )
}
