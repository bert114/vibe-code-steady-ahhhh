// Public API of the recovery feature — the ONLY import path other features may use.
import { request } from '../../lib/api/request.js'

export function getRecoveryState() {
  return request('/recovery/state', { silent: true })
}

export function startBreak(body) {
  return request('/recovery/breaks', { method: 'POST', body })
}

export function answerBreak(id, outcome) {
  return request(`/recovery/breaks/${id}/outcome`, { method: 'PATCH', body: { outcome } })
}

export function createCustomActivity(body) {
  return request('/recovery/activities', { method: 'POST', body })
}

export function getCustomActivities() {
  return request('/recovery/activities')
}

export { default as BreakSuggestionCard } from './components/BreakSuggestionCard.jsx'
export { default as RecoveryHost } from './components/RecoveryHost.jsx'
export { useRecoveryStore } from './store.js'

