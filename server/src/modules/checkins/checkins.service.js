// Business rules live here — never in controllers, routes, or React.
// Single mapping point: snake_case rows -> camelCase API objects.
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
  return toApi(row)
}

export async function getCheckins(userId, paging) {
  const rows = await repository.listCheckins(userId, paging)
  return rows.map(toApi)
}

export async function getCheckinById(userId, id) {
  return toApi(await repository.findCheckinById(userId, id))
}

export async function removeCheckin(userId, id) {
  return repository.deleteCheckinById(userId, id)
}

const TOP_TAGS_LIMIT = 5

function round1(n) {
  return Math.round(n * 10) / 10
}

// Advanced trend view: day-bucketed mood/energy/drain averages over a
// selectable window, plus which context tags recur on high-drain days.
// Pure read model over existing check-in data — no new tables.
export async function getTrends(userId, { windowDays }) {
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

