// Business rules live here — never in controllers, routes, or React.
// Single mapping point: snake_case rows -> camelCase API objects.
import { invalidateUserCache, readThrough } from '../../services/cache/cache.service.js'
import * as repository from './checkins.repository.js'

function toApi(row) {
  if (!row) return row
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    moodScore: row.mood_score,
    energyScore: row.energy_score,
    drainScore: row.drain_score,
    emotions: row.emotions,
    contextTags: row.context_tags,
    note: row.note,
    createdAt: row.created_at,
  }
}

export async function createCheckin(userId, input) {
  const row = await repository.insertCheckin(userId, {
    ...input,
    occurred_at: input.occurred_at ?? new Date().toISOString(),
  })
  await invalidateUserCache(userId)
  return toApi(row)
}

export async function getCheckins(userId, paging) {
  const rows = await repository.listCheckins(userId, paging)
  return rows.map(toApi)
}

export async function getCheckinById(userId, id) {
  return toApi(await repository.findCheckinById(userId, id))
}

// All-time history size for the user — factual count only, no scoring.
export async function getCheckinStats(userId) {
  const row = await repository.getCheckinStats(userId)
  return {
    totalCheckins: row?.total ?? 0,
    firstCheckinAt: row?.first_checkin_at ?? null,
  }
}

export async function removeCheckin(userId, id) {
  const deleted = await repository.deleteCheckinById(userId, id)
  if (deleted) await invalidateUserCache(userId)
  return deleted
}

const TOP_TAGS_LIMIT = 5
const TOP_INTERACTIONS_LIMIT = 6
const WEEK_DAYS = 7

// Rolling window summary for the Insights screen (7-day week / 30-day month):
// check-in weighted averages for mood, energy, and drain, plus top logged
// interaction context_tags sorted by frequency and the most draining interaction.
export async function getWindowSummary(userId, windowDays) {
  const sinceDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  const [row, tagRows] = await Promise.all([
    repository.getWindowAveragesSince(userId, sinceDate),
    repository.getTopInteractionsSince(userId, sinceDate),
  ])
  const checkins = row?.checkins ?? 0
  const allInteractions = tagRows.map((r) => ({
    tag: r.tag,
    count: r.count,
    averageDrain: round1(r.avg_drain),
  }))
  const mostDrainingInteraction =
    allInteractions.length > 0
      ? [...allInteractions].sort(
          (a, b) => b.averageDrain - a.averageDrain || b.count - a.count || a.tag.localeCompare(b.tag),
        )[0]
      : null
  return {
    windowDays,
    checkins,
    averageMood: checkins > 0 ? round1(row.avg_mood) : null,
    averageEnergy: checkins > 0 ? round1(row.avg_energy) : null,
    averageDrain: checkins > 0 ? round1(row.avg_drain) : null,
    interactions: allInteractions.slice(0, TOP_INTERACTIONS_LIMIT),
    mostDrainingInteraction,
  }
}

// Rolling weekly drain average: check-in level (each check-in weighted
// equally), not daily-bucket level. Null when the window has no check-ins.
export async function getWeeklyDrain(userId) {
  const sinceDate = new Date(Date.now() - WEEK_DAYS * 24 * 60 * 60 * 1000)
  const row = await repository.getDrainAverageSince(userId, sinceDate)
  const checkins = row?.checkins ?? 0
  return {
    windowDays: WEEK_DAYS,
    averageDrain: checkins > 0 ? round1(row.avg_drain) : null,
    checkins,
  }
}

function round1(n) {
  return Math.round(n * 10) / 10
}

// Advanced trend view: day-bucketed mood/energy/drain averages over a
// selectable window, plus which context tags recur on high-drain days.
// Pure read model over existing check-in data — no new tables.
export function getTrends(userId, { windowDays }) {
  return readThrough(userId, `trends:${windowDays}`, () => buildTrends(userId, windowDays))
}

async function buildTrends(userId, windowDays) {
  const sinceDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

  const [dayRows, tagRows] = await Promise.all([
    repository.getDailyAverages(userId, sinceDate),
    repository.getTopDrainingTags(userId, sinceDate, TOP_TAGS_LIMIT),
  ])

  const days = dayRows.map((row) => ({
    date: row.day,
    avgMood: round1(row.avg_mood),
    avgEnergy: round1(row.avg_energy),
    avgDrain: round1(row.avg_drain),
    checkins: row.checkins,
  }))

  return {
    windowDays,
    days,
    totalCheckins: days.reduce((sum, d) => sum + d.checkins, 0),
    topDrainingTags: tagRows.map((row) => ({ tag: row.tag, count: row.count })),
  }
}

