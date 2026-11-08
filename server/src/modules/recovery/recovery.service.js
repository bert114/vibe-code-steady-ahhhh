// Business rules live here — never in controllers, routes, or React.
// Single mapping point: snake_case rows -> camelCase API objects.
// Deterministic only: break suggestions come from check-in scores and the
// rule-based pattern engine, never from AI. Not cached — due-ness depends on
// the clock, and nothing here feeds the cached dashboard summary.
import { analyzeUserPatterns } from '../../services/patterns/pattern.service.js'
import { getCheckins } from '../checkins/checkins.service.js'
import * as repository from './recovery.repository.js'

const HOUR_MS = 60 * 60 * 1000
const LATEST_CHECKIN_WINDOW_HOURS = 12
const PATTERN_COOLDOWN_HOURS = 24
const STALE_BREAK_HOURS = 24
const STATS_WINDOW_DAYS = 90

export function isDrainedCheckin(checkin) {
  if (!checkin) return false
  const drain = Number(checkin.drainScore)
  const energy = Number(checkin.energyScore)
  const mood = Number(checkin.moodScore)
  // Suggest recovery if drain score is 1 (per user request) or >= 4,
  // or if energy is low (<= 2) or mood is drained (<= 2).
  return drain === 1 || drain >= 4 || (energy > 0 && energy <= 2) || (mood > 0 && mood <= 2)
}

function formatActivityName(tag) {
  if (!tag) return null
  const cleaned = String(tag).trim()
  if (!cleaned) return null
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
}

export function extractDrainingActivity(checkin, signals = []) {
  if (checkin?.contextTags?.length) {
    return formatActivityName(checkin.contextTags[0])
  }
  if (checkin?.context_tags?.length) {
    return formatActivityName(checkin.context_tags[0])
  }
  const repeatedCtx = signals.find((s) => s.type === 'repeated_draining_context')
  if (repeatedCtx?.evidence?.context) {
    return formatActivityName(repeatedCtx.evidence.context)
  }
  return null
}

function toApi(row) {
  if (!row) return null
  const drainingActivity =
    row.context_tags?.length
      ? formatActivityName(row.context_tags[0])
      : null
  return {
    id: row.id,
    checkinId: row.checkin_id,
    trigger: row.trigger_reason,
    activity: row.activity,
    durationMinutes: row.duration_minutes,
    startedAt: row.started_at,
    endsAt: row.ends_at,
    outcome: row.outcome,
    answeredAt: row.answered_at,
    ...(drainingActivity ? { drainingActivity } : {}),
  }
}

// Pure decision: should Steady Mind offer a break right now?
// Inputs are injected so the rule is unit-testable without a database.
export function decideBreakSuggestion({ latestCheckin, signals = [], latestBreak, now = new Date() }) {
  const nowMs = new Date(now).getTime()
  const hoursSince = (d) => (nowMs - new Date(d).getTime()) / HOUR_MS
  const breakStartedMs = latestBreak ? new Date(latestBreak.startedAt).getTime() : null
  const checkinMs = latestCheckin ? new Date(latestCheckin.occurredAt).getTime() : null
  const sameCheckin = Boolean(latestBreak && latestCheckin && latestBreak.checkinId === latestCheckin.id)
  const isBreakActive = latestBreak?.endsAt ? new Date(latestBreak.endsAt).getTime() > nowMs : false

  // Don't suggest a new break if a break is currently active
  if (isBreakActive) {
    return null
  }

  const drainingActivity = extractDrainingActivity(latestCheckin, signals)

  // 1. Drained latest checkin (drain score 1, drain >= 4, or low energy / mood)
  if (
    latestCheckin &&
    isDrainedCheckin(latestCheckin) &&
    hoursSince(latestCheckin.occurredAt) <= LATEST_CHECKIN_WINDOW_HOURS
  ) {
    // Fresh checkin with no break taken yet:
    if (!sameCheckin && !(breakStartedMs !== null && checkinMs !== null && breakStartedMs >= checkinMs)) {
      const res = { reason: 'latest_checkin', checkinId: latestCheckin.id }
      if (drainingActivity) res.drainingActivity = drainingActivity
      return res
    }

    // Follow-up suggestion: if past break finished with not_really or a_little, keep suggesting
    const needsMoreHelp = latestBreak?.outcome === 'not_really' || latestBreak?.outcome === 'a_little'
    if (needsMoreHelp) {
      const res = { reason: 'latest_checkin', checkinId: latestCheckin.id }
      if (drainingActivity) res.drainingActivity = drainingActivity
      return res
    }
  }

  // 2. Pattern signals (repeated draining context or high drain repeat)
  const hasDrainingPattern = signals.some((s) => s.type === 'high_drain_repeat' || s.type === 'repeated_draining_context')
  if (
    hasDrainingPattern &&
    !(latestBreak && hoursSince(latestBreak.startedAt) < PATTERN_COOLDOWN_HOURS)
  ) {
    const res = { reason: 'drain_pattern', checkinId: null }
    if (drainingActivity) res.drainingActivity = drainingActivity
    return res
  }

  return null
}

export async function getRecoveryState(userId, now = new Date()) {
  const staleSince = new Date(now.getTime() - STALE_BREAK_HOURS * HOUR_MS)
  const statsSince = new Date(now.getTime() - STATS_WINDOW_DAYS * 24 * HOUR_MS)

  const [recent, patterns, openRow, latestRow, statRows, customRows] = await Promise.all([
    getCheckins(userId, { limit: 1, offset: 0 }),
    analyzeUserPatterns(userId),
    repository.findOpenBreak(userId, staleSince),
    repository.findLatestBreak(userId),
    repository.getActivityStats(userId, statsSince),
    repository.listCustomActivities(userId),
  ])

  const open = toApi(openRow)
  const isActive = open && new Date(open.endsAt).getTime() > now.getTime()
  const activeBreak = isActive ? open : null
  const dueBreak = open && !isActive ? open : null

  const suggestBreak =
    activeBreak || dueBreak
      ? null
      : decideBreakSuggestion({
          latestCheckin: recent[0] ?? null,
          signals: patterns.signals,
          latestBreak: toApi(latestRow),
          now,
        })

  const latestCheckin = recent[0] ?? null
  const drainingActivity =
    suggestBreak?.drainingActivity ||
    activeBreak?.drainingActivity ||
    dueBreak?.drainingActivity ||
    extractDrainingActivity(latestCheckin, patterns.signals)

  const isDraining = Boolean(
    suggestBreak ||
    activeBreak ||
    dueBreak ||
    (latestCheckin &&
      isDrainedCheckin(latestCheckin) &&
      (now.getTime() - new Date(latestCheckin.occurredAt).getTime()) / HOUR_MS <= LATEST_CHECKIN_WINDOW_HOURS) ||
    patterns.signals.some((s) => s.type === 'high_drain_repeat' || s.type === 'repeated_draining_context'),
  )

  return {
    activeBreak,
    dueBreak,
    suggestBreak,
    drainingStatus: {
      isDraining,
      activity: drainingActivity || (isDraining ? 'High drain' : null),
      drainScore: latestCheckin?.drainScore ?? null,
    },
    activityStats: statRows.map((r) => ({ activity: r.activity, total: r.total, helped: r.helped })),
    customActivities: customRows.map((r) => ({
      id: r.id,
      name: r.name,
      hint: r.hint,
      createdAt: r.created_at,
    })),
  }
}

// Returns { notFound: true } when checkinId or custom activity is not the caller's;
// otherwise the new (or already-running) break. Never creates overlapping breaks.
export async function startBreak(userId, input, now = new Date()) {
  let checkinId = input.checkinId ?? null
  if (checkinId) {
    const owned = await repository.checkinBelongsToUser(userId, checkinId)
    if (!owned) return { notFound: true }
  } else {
    // If not supplied, link to recent high-drain checkin if one occurred in window
    const recent = await getCheckins(userId, { limit: 1, offset: 0 })
    if (recent[0] && isDrainedCheckin(recent[0])) {
      checkinId = recent[0].id
    }
  }

  if (input.activity.startsWith('custom:')) {
    const customId = input.activity.slice(7)
    const custom = await repository.findCustomActivityById(userId, customId)
    if (!custom) return { notFound: true }
  }

  const staleSince = new Date(now.getTime() - STALE_BREAK_HOURS * HOUR_MS)
  const open = await repository.findOpenBreak(userId, staleSince)
  if (open && new Date(open.ends_at).getTime() > now.getTime()) {
    return { break: toApi(open), created: false }
  }
  const row = await repository.insertBreak(userId, { ...input, checkinId })
  return { break: toApi(row), created: true }
}

export async function answerBreak(userId, id, outcome) {
  return toApi(await repository.answerBreak(userId, id, outcome))
}

export async function createCustomActivity(userId, input) {
  const row = await repository.insertCustomActivity(userId, input)
  return {
    id: row.id,
    name: row.name,
    hint: row.hint,
    createdAt: row.created_at,
  }
}

export async function getCustomActivities(userId) {
  const rows = await repository.listCustomActivities(userId)
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    hint: r.hint,
    createdAt: r.created_at,
  }))
}


