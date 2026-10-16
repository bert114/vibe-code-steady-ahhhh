import { useEffect, useRef, useState } from 'react'
import DrainIcon from './DrainIcon.jsx'
import EnergyIcon from './EnergyIcon.jsx'
import FaceIcon from './FaceIcon.jsx'

function scoreLabel(type, val) {
  const num = Number(val)
  if (type === 'mood') {
    if (num <= 1) return { text: 'Low', cls: 'badge--mood-rough' }
    if (num <= 3) return { text: 'Okay', cls: 'badge--mood-okay' }
    return { text: 'Good', cls: 'badge--mood-great' }
  }
  if (type === 'energy') {
    if (num <= 1) return { text: 'Very little', cls: 'badge--energy-low' }
    if (num <= 3) return { text: 'Some', cls: 'badge--energy-mid' }
    return { text: 'A lot', cls: 'badge--energy-high' }
  }
  if (type === 'drain') {
    if (num <= 1) return { text: 'Not at all', cls: 'badge--drain-light' }
    if (num <= 3) return { text: 'A little', cls: 'badge--drain-mid' }
    return { text: 'A lot', cls: 'badge--drain-heavy' }
  }
  return { text: String(val), cls: '' }
}

function formatCheckinDate(occurredAt) {
  return new Date(occurredAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCheckinTime(occurredAt) {
  return new Date(occurredAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function HistoryCard({ checkin, onRequestDelete }) {
  const [expanded, setExpanded] = useState(false)

  const mood = scoreLabel('mood', checkin.moodScore)
  const energy = scoreLabel('energy', checkin.energyScore)
  const drain = scoreLabel('drain', checkin.drainScore)

  const hasEmotions = checkin.emotions && checkin.emotions.length > 0
  const hasContextTags = checkin.contextTags && checkin.contextTags.length > 0
  const isLongNote = checkin.note && checkin.note.length > 120

  const dateStr = formatCheckinDate(checkin.occurredAt)
  const timeStr = formatCheckinTime(checkin.occurredAt)

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
          <button
            type="button"
            className="btn-ghost btn-sm history-card__delete-btn"
            onClick={() => onRequestDelete(checkin)}
            aria-label={`Delete check-in from ${dateStr} ${timeStr}`}
          >
            Delete
          </button>
        </div>
      </header>

      <div className="history-card__scores">
        <div className="history-card__score-box" aria-label={`Mood: ${mood.text}`}>
          <span className={`history-card__score-icon ${mood.cls}`}>
            <FaceIcon score={checkin.moodScore} />
          </span>
          <span className="history-card__score-sub">{mood.text}</span>
        </div>
        <div className="history-card__score-box" aria-label={`Energy: ${energy.text}`}>
          <span className={`history-card__score-icon ${energy.cls}`}>
            <EnergyIcon score={checkin.energyScore} />
          </span>
          <span className="history-card__score-sub">{energy.text}</span>
        </div>
        <div className="history-card__score-box" aria-label={`Feeling drained: ${drain.text}`}>
          <span className={`history-card__score-icon ${drain.cls}`}>
            <DrainIcon score={checkin.drainScore} />
          </span>
          <span className="history-card__score-sub">{drain.text}</span>
        </div>
      </div>

      {checkin.note && (
        <div className="history-card__note-lines">
          {expanded ? (
            <p className="history-card__note">{checkin.note}</p>
          ) : (
            <p className="history-card__note-preview">
              {checkin.note.length > 120
                ? `${checkin.note.slice(0, 120)}…`
                : checkin.note}
            </p>
          )}
        </div>
      )}

      {(hasEmotions || hasContextTags || isLongNote) && (
        <div className="history-card__optionals">
          {hasEmotions && (
            <div className="history-card__optional-box">
              {checkin.emotions.map((e, idx) => (
                <span key={`emo-${idx}`} className="chip chip--emotion">
                  {e}
                </span>
              ))}
            </div>
          )}
          {hasContextTags && (
            <div className="history-card__optional-box">
              {checkin.contextTags.map((tag, idx) => (
                <span key={`tag-${idx}`} className="chip chip--context">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {isLongNote && (
            <div className="history-card__optional-box history-card__optional-box--action">
              <button
                type="button"
                className="btn-link history-card__expand-btn"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                {expanded ? 'Show less' : 'Read full note'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function DeleteCheckinDialog({ checkin, deleting, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const mood = checkin ? scoreLabel('mood', checkin.moodScore) : null
  const energy = checkin ? scoreLabel('energy', checkin.energyScore) : null
  const drain = checkin ? scoreLabel('drain', checkin.drainScore) : null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (checkin && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!checkin && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [checkin])

  return (
    <dialog
      ref={dialogRef}
      className="checkin-delete-dialog"
      aria-labelledby="checkin-delete-title"
      aria-describedby="checkin-delete-description"
      aria-busy={deleting}
      onCancel={(event) => {
        event.preventDefault()
        if (!deleting) onCancel()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !deleting) onCancel()
      }}
    >
      {checkin && (
        <div className="checkin-delete-dialog__content">
          <h2 id="checkin-delete-title">Delete this check-in?</h2>
          <p id="checkin-delete-description">
            This check-in will be permanently deleted. You can’t undo this.
          </p>

          <div className="checkin-delete-dialog__record">
            <time dateTime={checkin.occurredAt}>
              {formatCheckinDate(checkin.occurredAt)} · {formatCheckinTime(checkin.occurredAt)}
            </time>
            <dl className="checkin-delete-dialog__scores">
              <div>
                <dt>
                  <span className={`checkin-delete-dialog__score-icon ${mood.cls}`}>
                    <FaceIcon score={checkin.moodScore} />
                  </span>
                  <span>Mood</span>
                </dt>
                <dd>{mood.text}</dd>
              </div>
              <div>
                <dt>
                  <span className={`checkin-delete-dialog__score-icon ${energy.cls}`}>
                    <EnergyIcon score={checkin.energyScore} />
                  </span>
                  <span>Energy</span>
                </dt>
                <dd>{energy.text}</dd>
              </div>
              <div>
                <dt>
                  <span className={`checkin-delete-dialog__score-icon ${drain.cls}`}>
                    <DrainIcon score={checkin.drainScore} />
                  </span>
                  <span>Feeling drained</span>
                </dt>
                <dd>{drain.text}</dd>
              </div>
            </dl>
          </div>

          <div className="checkin-delete-dialog__actions">
            <button
              type="button"
              className="btn-ghost checkin-delete-dialog__cancel"
              onClick={onCancel}
              disabled={deleting}
              autoFocus
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger checkin-delete-dialog__confirm"
              onClick={onConfirm}
              disabled={deleting}
            >
              <span aria-live="polite">{deleting ? 'Deleting…' : 'Delete check-in'}</span>
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}

export default function CheckInHistoryList({ checkins = [], onDelete }) {
  const [selectedCheckin, setSelectedCheckin] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const cancelDelete = () => {
    if (!deleting) setSelectedCheckin(null)
  }

  const confirmDelete = async () => {
    if (!selectedCheckin || deleting) return

    setDeleting(true)
    try {
      await onDelete(selectedCheckin.id)
      setSelectedCheckin(null)
    } catch {
      // The store already shows an error toast. Keep the dialog open for retry.
    } finally {
      setDeleting(false)
    }
  }

  if (!checkins || checkins.length === 0) {
    return (
      <div className="checkin-history__empty-card">
        <p className="checkin-history__empty-title">No check-ins yet</p>
        <p className="checkin-history__empty-desc">
          Save your first check-in above to start your history.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="checkin-history__timeline" role="feed" aria-label="Check-in history">
        {checkins.map((checkin) => (
          <HistoryCard
            key={checkin.id}
            checkin={checkin}
            onRequestDelete={setSelectedCheckin}
          />
        ))}
      </div>
      <DeleteCheckinDialog
        checkin={selectedCheckin}
        deleting={deleting}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </>
  )
}
