// Business rules live here — never in controllers, routes, or React.
// Single mapping point: snake_case rows -> camelCase API objects.
import * as repository from './reminders.repository.js'

function toApi(row) {
  if (!row) return row
  return {
    id: row.id,
    insightId: row.insight_id,
    kind: row.kind,
    message: row.message,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

export async function getReminders(userId, paging) {
  const rows = await repository.listReminders(userId, paging)
  return rows.map(toApi)
}

export async function markReminderRead(userId, id) {
  return toApi(await repository.markReminderRead(userId, id))
}

export async function countUnreadReminders(userId) {
  return repository.countUnreadReminders(userId)
}
