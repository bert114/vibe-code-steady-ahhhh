// Public API of the reminders feature — the ONLY import path other
// features may use.
import { request } from '../../lib/api/request.js'

export function getSignals() {
  return request('/insights/signals')
}

export function getDashboardSummary() {
  return request('/dashboard/summary')
}

export function getReminders() {
  return request('/reminders')
}

export function markReminderRead(id) {
  return request(`/reminders/${id}/read`, { method: 'PATCH' })
}
