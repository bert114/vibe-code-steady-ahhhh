import { useEffect, useState } from 'react'
import { resolveActivity, useRecoveryStore } from '../store.js'

function formatRemaining(ms) {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.ceil(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function BreakTimerPill({ activeBreak, onEndEarly, onComplete }) {
  const [remainingMs, setRemainingMs] = useState(() => {
    if (!activeBreak?.endsAt) return 0
    return Math.max(0, new Date(activeBreak.endsAt).getTime() - Date.now())
  })

  useEffect(() => {
    if (!activeBreak?.endsAt) return

    const update = () => {
      const left = new Date(activeBreak.endsAt).getTime() - Date.now()
      if (left <= 0) {
        setRemainingMs(0)
        onComplete?.()
      } else {
        setRemainingMs(left)
      }
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [activeBreak?.endsAt, onComplete])

  if (!activeBreak || remainingMs <= 0) return null

  const customActivities = useRecoveryStore.getState().state.customActivities || []
  const activityMeta = resolveActivity(activeBreak.activity, customActivities)
  const label = activityMeta ? activityMeta.label : 'Break'
  const totalDurationMs = (activeBreak.durationMinutes || 5) * 60 * 1000
  const progressPercent = Math.min(100, Math.max(0, ((totalDurationMs - remainingMs) / totalDurationMs) * 100))
  const drainingActivity = activeBreak.drainingActivity

  return (
    <div className="recovery-timer-pill" role="status" aria-live="polite">
      <div className="recovery-timer-pill__progress" style={{ width: `${progressPercent}%` }} />
      <div className="recovery-timer-pill__content">
        <span className="recovery-timer-pill__indicator" aria-hidden="true" />
        <div className="recovery-timer-pill__info">
          <div className="recovery-timer-pill__title-row">
            <strong className="recovery-timer-pill__name">{label}</strong>
            {drainingActivity && (
              <span className="recovery-timer-pill__draining-tag">from {drainingActivity}</span>
            )}
          </div>
          <span className="recovery-timer-pill__countdown">{formatRemaining(remainingMs)} left</span>
        </div>
        <button
          type="button"
          className="recovery-timer-pill__btn"
          onClick={onEndEarly}
        >
          I&apos;m back early
        </button>
      </div>
    </div>
  )
}

