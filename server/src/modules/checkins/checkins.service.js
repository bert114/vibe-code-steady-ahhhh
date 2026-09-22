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
